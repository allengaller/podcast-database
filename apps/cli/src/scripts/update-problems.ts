import { LeetCodeGraphQLClient, LeetCodeProblem } from '@leetcast/core';
import { CacheManager } from '../utils/cache-manager';
import ora from 'ora';
import chalk from 'chalk';

async function main() {
  const spinner = ora('Fetching Top 100 LeetCode problems...').start();

  try {
    const list = await LeetCodeGraphQLClient.getProblemList(100);
    spinner.text = `Found ${list.length} problems. Fetching details...`;

    const problems: LeetCodeProblem[] = [];

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      spinner.text = `Fetching details for [${i + 1}/${list.length}]: ${p.title}`;

      try {
        const detail = await LeetCodeGraphQLClient.getProblemDetail(p.titleSlug);

        // Basic description cleaning (it's HTML from LeetCode)
        const description = detail.content || '';

        problems.push({
          id: detail.questionFrontendId,
          title: detail.title,
          titleSlug: detail.titleSlug,
          difficulty: detail.difficulty,
          topics: detail.topicTags.map((t: any) => t.name),
          description: description,
          acceptanceRate: p.acRate,
          hints: detail.hints || [],
          // Note: Solution might be null or paid only
          solution: detail.solution?.content || undefined,
        });
      } catch (err) {
        console.error(`\nFailed to fetch details for ${p.title}:`, err);
      }
    }

    await CacheManager.saveCache(problems);
    spinner.succeed(chalk.green(`Successfully updated cache with ${problems.length} problems!`));
    console.log(`Cache saved to: ${CacheManager.getCachePath()}`);
  } catch (error) {
    spinner.fail(chalk.red('Failed to update problems cache'));
    console.error(error);
    process.exit(1);
  }
}

main();
