import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = {
  problem: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
};
vi.mock('@leetcast/database', () => ({ prisma: prismaMock }));

function makeReq(url: string) {
  return new Request(url, { method: 'GET' });
}

async function loadRoute() {
  const mod = await import('@/app/api/problems/route');
  return mod.GET;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/problems', () => {
  it('returns paginated problems with default page size 20', async () => {
    prismaMock.problem.findMany.mockResolvedValueOnce([{ id: 'LC-1' }]);
    prismaMock.problem.count.mockResolvedValueOnce(42);

    const GET = await loadRoute();
    const res = await GET(makeReq('http://localhost/api/problems') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.problems).toEqual([{ id: 'LC-1' }]);
    expect(body.total).toBe(42);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);

    const findArgs = prismaMock.problem.findMany.mock.calls[0][0];
    expect(findArgs.skip).toBe(0);
    expect(findArgs.take).toBe(20);
    expect(findArgs.orderBy).toEqual({ id: 'asc' });
  });

  it('honors ?page=2 by skipping 20 items', async () => {
    prismaMock.problem.findMany.mockResolvedValueOnce([]);
    prismaMock.problem.count.mockResolvedValueOnce(0);

    const GET = await loadRoute();
    await GET(makeReq('http://localhost/api/problems?page=2') as never);

    const findArgs = prismaMock.problem.findMany.mock.calls[0][0];
    expect(findArgs.skip).toBe(20);
  });

  it('filters by query (title contains, case-insensitive) and id', async () => {
    prismaMock.problem.findMany.mockResolvedValueOnce([]);
    prismaMock.problem.count.mockResolvedValueOnce(0);

    const GET = await loadRoute();
    await GET(makeReq('http://localhost/api/problems?q=two') as never);

    const findArgs = prismaMock.problem.findMany.mock.calls[0][0];
    expect(findArgs.where.OR).toEqual([
      { title: { contains: 'two', mode: 'insensitive' } },
      { id: { contains: 'two' } },
    ]);
  });

  it('filters by difficulty when provided', async () => {
    prismaMock.problem.findMany.mockResolvedValueOnce([]);
    prismaMock.problem.count.mockResolvedValueOnce(0);

    const GET = await loadRoute();
    await GET(makeReq('http://localhost/api/problems?difficulty=Easy') as never);

    const findArgs = prismaMock.problem.findMany.mock.calls[0][0];
    expect(findArgs.where.difficulty).toBe('Easy');
  });

  it('filters by topic using array `has` operator', async () => {
    prismaMock.problem.findMany.mockResolvedValueOnce([]);
    prismaMock.problem.count.mockResolvedValueOnce(0);

    const GET = await loadRoute();
    await GET(makeReq('http://localhost/api/problems?topic=dp') as never);

    const findArgs = prismaMock.problem.findMany.mock.calls[0][0];
    expect(findArgs.where.topics).toEqual({ has: 'dp' });
  });

  it('combines all filters at once', async () => {
    prismaMock.problem.findMany.mockResolvedValueOnce([]);
    prismaMock.problem.count.mockResolvedValueOnce(0);

    const GET = await loadRoute();
    await GET(
      makeReq('http://localhost/api/problems?q=two&difficulty=Easy&topic=dp&page=3') as never
    );

    const findArgs = prismaMock.problem.findMany.mock.calls[0][0];
    expect(findArgs.where).toMatchObject({
      OR: [{ title: { contains: 'two', mode: 'insensitive' } }, { id: { contains: 'two' } }],
      difficulty: 'Easy',
      topics: { has: 'dp' },
    });
    expect(findArgs.skip).toBe(40);
  });
});