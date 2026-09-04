import { LeetCodeProblem } from '../types/leetcode';
import { CacheManager } from '../utils/cache-manager';

export class LeetCodeService {
  private static mockProblems: LeetCodeProblem[] = [
    {
      id: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      topics: ['Array', 'Hash Table'],
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      acceptanceRate: '50.1%',
    },
    {
      id: '2',
      title: 'Add Two Numbers',
      titleSlug: 'add-two-numbers',
      difficulty: 'Medium',
      topics: ['Linked List', 'Math', 'Recursion'],
      description:
        'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit.',
      acceptanceRate: '41.2%',
    },
    {
      id: '3',
      title: 'Longest Substring Without Repeating Characters',
      titleSlug: 'longest-substring-without-repeating-characters',
      difficulty: 'Medium',
      topics: ['Hash Table', 'String', 'Sliding Window'],
      description:
        'Given a string s, find the length of the longest substring without repeating characters.',
      acceptanceRate: '34.3%',
    },
    {
      id: '15',
      title: '3Sum',
      titleSlug: '3sum',
      difficulty: 'Medium',
      topics: ['Array', 'Two Pointers', 'Sorting'],
      description:
        'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.',
      acceptanceRate: '33.5%',
    },
    {
      id: '42',
      title: 'Trapping Rain Water',
      titleSlug: 'trapping-rain-water',
      difficulty: 'Hard',
      topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'],
      description:
        'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
      acceptanceRate: '59.8%',
    },
  ];

  private static async getProblems(): Promise<LeetCodeProblem[]> {
    const cached = await CacheManager.loadCache();
    if (cached && cached.length > 0) {
      return cached;
    }
    return this.mockProblems;
  }

  static async getPopularProblems(): Promise<LeetCodeProblem[]> {
    return await this.getProblems();
  }

  static async getProblemById(id: string): Promise<LeetCodeProblem | undefined> {
    const problems = await this.getProblems();
    return problems.find((p) => p.id === id);
  }

  static async searchProblems(query: string): Promise<LeetCodeProblem[]> {
    const q = query.toLowerCase();
    const problems = await this.getProblems();
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.id.includes(q) ||
        p.topics.some((t) => t.toLowerCase().includes(q))
    );
  }
}
