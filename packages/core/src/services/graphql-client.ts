/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
// The LeetCode GraphQL response shape is loosely typed by upstream; we treat
// the wire payload as `any` here and rely on the call-site <T> to assert the
// final shape. Narrowing every nested key would require duplicating the schema.
import axios from 'axios';
import { GraphQLResponse } from '../types/leetcode';
import { retryWithBackoff, sleep } from '../utils/retry-utils';

export class LeetCodeGraphQLClient {
  private static readonly ENDPOINT = 'https://leetcode.com/graphql';
  private static readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  static async query<T>(query: string, variables: any = {}): Promise<T> {
    return retryWithBackoff(async () => {
      const response = await axios.post<GraphQLResponse<T>>(
        this.ENDPOINT,
        { query, variables },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': this.USER_AGENT,
            Referer: 'https://leetcode.com/',
          },
          timeout: 10000,
        }
      );

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      // Add a small delay to avoid rate limiting
      await sleep(200);

      return response.data.data;
    });
  }

  static async getProblemList(limit: number = 100): Promise<any[]> {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              id
              slug
            }
            hasVideoSolution
            hasSolution
          }
        }
      }
    `;

    const data = await this.query<{ problemsetQuestionList: { questions: any[] } }>(query, {
      categorySlug: '',
      limit,
      skip: 0,
      filters: {},
    });

    return data.problemsetQuestionList.questions;
  }

  static async getProblemDetail(titleSlug: string): Promise<any> {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          stats
          topicTags {
            name
            slug
          }
          hints
          solution {
            id
            canSeeDetail
            paidOnly
            hasVideoSolution
            content
          }
        }
      }
    `;

    const data = await this.query<{ question: any }>(query, { titleSlug });
    return data.question;
  }
}
