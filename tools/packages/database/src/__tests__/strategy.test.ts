/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
// This file uses jest's `expect.objectContaining` and `require('../index')` for
// mocking; the matcher return type is `any` by design in @types/jest, so we
// disable the unsafe-* rules locally rather than scatter type assertions.
import { StrategyEngine } from '../strategy';
import { prisma } from '../index';

// Mock prisma (database barrel lives at src/index.ts, hence '../index')
jest.mock('../index', () => ({
  prisma: {
    userProgress: {
      findUnique: jest.fn(),
    },
    problem: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    podcast: {},
  },
}));

const mockedPrisma = prisma as unknown as {
  userProgress: { findUnique: jest.Mock };
  problem: { findFirst: jest.Mock; count: jest.Mock };
};

describe('StrategyEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectDailyProblem', () => {
    it('should dispatch to progressive strategy', async () => {
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '1' });

      const result = await StrategyEngine.selectDailyProblem('progressive');
      expect(result).toBe('1');
      expect(mockedPrisma.problem.findFirst).toHaveBeenCalled();
    });

    it('should dispatch to classic strategy', async () => {
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '2' });

      const result = await StrategyEngine.selectDailyProblem('classic');
      expect(result).toBe('2');
    });

    it('should dispatch to weakspot strategy', async () => {
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '3' });

      const result = await StrategyEngine.selectDailyProblem('weakspot', 'user-1');
      expect(result).toBe('3');
    });

    it('should return null when no problems exist', async () => {
      mockedPrisma.problem.findFirst.mockResolvedValue(null);

      const result = await StrategyEngine.selectDailyProblem('progressive');
      expect(result).toBeNull();
    });
  });

  describe('selectProgressive', () => {
    it('should select Easy for new users (0 completed)', async () => {
      mockedPrisma.userProgress.findUnique.mockResolvedValue(null);
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '1' });

      await StrategyEngine.selectDailyProblem('progressive', 'user-1');

      expect(mockedPrisma.problem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: 'Easy' }),
        })
      );
    });

    it('should select Medium for users with 10-19 completed', async () => {
      mockedPrisma.userProgress.findUnique.mockResolvedValue({ totalCompleted: 15 });
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '2' });

      await StrategyEngine.selectDailyProblem('progressive', 'user-1');

      expect(mockedPrisma.problem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: 'Medium' }),
        })
      );
    });

    it('should select Hard for users with 20+ completed', async () => {
      mockedPrisma.userProgress.findUnique.mockResolvedValue({ totalCompleted: 25 });
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '42' });

      await StrategyEngine.selectDailyProblem('progressive', 'user-1');

      expect(mockedPrisma.problem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: 'Hard' }),
        })
      );
    });
  });

  describe('selectWeakSpot', () => {
    it('should filter by weak topics when available', async () => {
      mockedPrisma.userProgress.findUnique.mockResolvedValue({
        weakTopics: ['Dynamic Programming', 'Graph'],
      });
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '5' });

      await StrategyEngine.selectDailyProblem('weakspot', 'user-1');

      expect(mockedPrisma.problem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topics: { hasSome: ['Dynamic Programming', 'Graph'] },
          }),
        })
      );
    });

    it('should fall back to random when no weak topics', async () => {
      mockedPrisma.userProgress.findUnique.mockResolvedValue({ weakTopics: [] });
      mockedPrisma.problem.count.mockResolvedValue(10);
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '7' });

      const result = await StrategyEngine.selectDailyProblem('weakspot', 'user-1');
      expect(result).toBe('7');
    });

    it('should fall back to random for anonymous users', async () => {
      mockedPrisma.problem.count.mockResolvedValue(5);
      mockedPrisma.problem.findFirst.mockResolvedValue({ id: '3' });

      const result = await StrategyEngine.selectDailyProblem('weakspot');
      expect(result).toBe('3');
    });
  });
});
