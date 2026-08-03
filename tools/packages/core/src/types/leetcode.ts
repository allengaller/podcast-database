// `Difficulty` is a runtime string from the LeetCode GraphQL payload, so it
// stays `string` for ergonomic JSON parsing. Callers that need to narrow it
// should compare against the known literals (`'Easy' | 'Medium' | 'Hard'`).
export type Difficulty = string;

export interface LeetCodeProblem {
  id: string;
  title: string;
  titleSlug: string;
  difficulty: Difficulty | string;
  topics: string[];
  description: string;
  acceptanceRate: string;
  examples?: string;
  constraints?: string;
  hints?: string[];
  solution?: string;
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}
