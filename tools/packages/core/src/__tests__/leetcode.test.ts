import { LeetCodeService } from '../services/leetcode';
import { CacheManager } from '../utils/cache-manager';
import { LeetCodeProblem } from '../types/leetcode';

jest.mock('../utils/cache-manager', () => ({
  CacheManager: {
    loadCache: jest.fn(),
    saveCache: jest.fn(),
  },
}));

const mockedCache = CacheManager as jest.Mocked<typeof CacheManager>;

const mockProblems: LeetCodeProblem[] = [
  {
    id: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    topics: ['Array', 'Hash Table'],
    description: 'desc',
    acceptanceRate: '50%',
  },
  {
    id: '15',
    title: '3Sum',
    titleSlug: '3sum',
    difficulty: 'Medium',
    topics: ['Array', 'Two Pointers'],
    description: 'desc',
    acceptanceRate: '33%',
  },
  {
    id: '42',
    title: 'Trapping Rain Water',
    titleSlug: 'trapping-rain-water',
    difficulty: 'Hard',
    topics: ['Dynamic Programming'],
    description: 'desc',
    acceptanceRate: '59%',
  },
];

describe('LeetCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCache.loadCache.mockResolvedValue([]);
  });

  describe('getPopularProblems', () => {
    it('returns cached problems when present', async () => {
      mockedCache.loadCache.mockResolvedValueOnce(mockProblems);
      const result = await LeetCodeService.getPopularProblems();
      expect(result).toEqual(mockProblems);
      expect(mockedCache.loadCache).toHaveBeenCalledTimes(1);
    });

    it('falls back to bundled mock data when cache is empty', async () => {
      mockedCache.loadCache.mockResolvedValueOnce([]);
      const result = await LeetCodeService.getPopularProblems();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
    });
  });

  describe('getProblemById', () => {
    beforeEach(() => {
      mockedCache.loadCache.mockResolvedValue(mockProblems);
    });

    it('returns the matching problem', async () => {
      const p = await LeetCodeService.getProblemById('1');
      expect(p?.title).toBe('Two Sum');
    });

    it('returns undefined when id is missing', async () => {
      const p = await LeetCodeService.getProblemById('9999');
      expect(p).toBeUndefined();
    });
  });

  describe('searchProblems', () => {
    beforeEach(() => {
      mockedCache.loadCache.mockResolvedValue(mockProblems);
    });

    it('matches by case-insensitive title and topic', async () => {
      const r = await LeetCodeService.searchProblems('TWO');
      // 'Two Sum' matches via title; '3Sum' matches via 'Two Pointers' topic
      expect(r.map((p) => p.id).sort()).toEqual(['1', '15']);
    });

    it('matches by id substring', async () => {
      const r = await LeetCodeService.searchProblems('15');
      expect(r.map((p) => p.id)).toEqual(['15']);
    });

    it('matches by topic (case-insensitive)', async () => {
      const r = await LeetCodeService.searchProblems('dynamic');
      expect(r.map((p) => p.id)).toEqual(['42']);
    });

    it('returns empty array when nothing matches', async () => {
      const r = await LeetCodeService.searchProblems('no-such-query-zzz');
      expect(r).toEqual([]);
    });
  });
});
