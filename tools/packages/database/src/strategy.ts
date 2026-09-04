import { prisma } from './index';

export type StrategyType = 'progressive' | 'classic' | 'weakspot';

export class StrategyEngine {
  static async selectDailyProblem(strategy: StrategyType, userId?: string): Promise<string | null> {
    switch (strategy) {
      case 'progressive':
        return this.selectProgressive(userId);
      case 'classic':
        return this.selectClassic();
      case 'weakspot':
        return this.selectWeakSpot(userId);
      default:
        return this.selectRandom();
    }
  }

  private static async selectProgressive(userId?: string): Promise<string | null> {
    // Easy -> Medium -> Hard based on user's completion count
    let difficulty = 'Easy';
    if (userId) {
      const progress = await prisma.userProgress.findUnique({ where: { userId } });
      const completed = progress?.totalCompleted || 0;
      if (completed >= 20) difficulty = 'Hard';
      else if (completed >= 10) difficulty = 'Medium';
    }

    const problem = await prisma.problem.findFirst({
      where: { difficulty },
      orderBy: { id: 'asc' },
    });
    return problem?.id || null;
  }

  private static async selectClassic(): Promise<string | null> {
    // Follow NeetCode 150 order roughly by problem id ascending
    const problem = await prisma.problem.findFirst({
      where: {
        podcasts: { none: { isDaily: true } },
      },
      orderBy: { id: 'asc' },
    });
    return problem?.id || null;
  }

  private static async selectWeakSpot(userId?: string): Promise<string | null> {
    if (!userId) return this.selectRandom();

    const progress = await prisma.userProgress.findUnique({ where: { userId } });
    const weakTopics = progress?.weakTopics || [];

    if (weakTopics.length > 0) {
      const problem = await prisma.problem.findFirst({
        where: {
          topics: { hasSome: weakTopics },
          podcasts: { none: { isDaily: true } },
        },
        orderBy: { id: 'asc' },
      });
      if (problem) return problem.id;
    }

    return this.selectRandom();
  }

  private static async selectRandom(): Promise<string | null> {
    const count = await prisma.problem.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const problem = await prisma.problem.findFirst({ skip, orderBy: { id: 'asc' } });
    return problem?.id || null;
  }
}
