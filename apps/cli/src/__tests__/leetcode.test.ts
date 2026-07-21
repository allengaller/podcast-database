import { LeetCodeService } from '@leetcast/core';

describe('LeetCodeService', () => {
  describe('getPopularProblems', () => {
    it('should return an array of problems', async () => {
      const problems = await LeetCodeService.getPopularProblems();
      expect(Array.isArray(problems)).toBe(true);
      expect(problems.length).toBeGreaterThan(0);
    });

    it('should return problems with required fields', async () => {
      const problems = await LeetCodeService.getPopularProblems();
      const problem = problems[0];

      expect(problem).toHaveProperty('id');
      expect(problem).toHaveProperty('title');
      expect(problem).toHaveProperty('titleSlug');
      expect(problem).toHaveProperty('difficulty');
      expect(problem).toHaveProperty('topics');
      expect(problem).toHaveProperty('description');
    });
  });

  describe('getProblemById', () => {
    it('should return a problem when given a valid ID', async () => {
      const problem = await LeetCodeService.getProblemById('1');
      expect(problem).toBeDefined();
      expect(problem?.id).toBe('1');
      expect(problem?.title).toBe('Two Sum');
    });

    it('should return undefined for invalid ID', async () => {
      const problem = await LeetCodeService.getProblemById('invalid-id');
      expect(problem).toBeUndefined();
    });
  });

  describe('searchProblems', () => {
    it('should return matching problems', async () => {
      const results = await LeetCodeService.searchProblems('Two');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Two');
    });

    it('should return empty array for no matches', async () => {
      const results = await LeetCodeService.searchProblems('xyznonexistent');
      expect(results).toEqual([]);
    });

    it('should search in topics', async () => {
      const results = await LeetCodeService.searchProblems('Array');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.topics.includes('Array'))).toBe(true);
    });
  });
});
