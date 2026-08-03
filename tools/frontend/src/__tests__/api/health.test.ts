import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the workspace database package before importing the route under test.
const prismaMock = {
  $queryRaw: vi.fn(),
};
vi.mock('@leetcast/database', () => ({ prisma: prismaMock }));

// Mock ioredis so we never reach out to a real Redis.
const redisInstance = {
  connect: vi.fn(),
  ping: vi.fn(),
  quit: vi.fn(),
};
const IORedisMock = vi.fn(() => redisInstance);
vi.mock('ioredis', () => ({ default: IORedisMock }));

async function loadRoute() {
  const mod = await import('@/app/api/health/route');
  return mod.GET;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

describe('GET /api/health', () => {
  it('returns 200 with all checks ok when both DB and Redis respond', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    redisInstance.ping.mockResolvedValueOnce('PONG');

    const GET = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks).toEqual({ web: 'ok', database: 'ok', redis: 'ok' });
    expect(typeof body.timestamp).toBe('string');
  });

  it('returns 503 when the database is unreachable but Redis is fine', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    redisInstance.ping.mockResolvedValueOnce('PONG');

    const GET = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.checks.database).toBe('error');
    expect(body.checks.redis).toBe('ok');
  });

  it('returns 503 when Redis ping fails', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    redisInstance.ping.mockRejectedValueOnce(new Error('redis down'));

    const GET = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.checks.redis).toBe('error');
  });

  it('still closes the Redis connection on success path', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    redisInstance.ping.mockResolvedValueOnce('PONG');

    const GET = await loadRoute();
    await GET();

    expect(redisInstance.connect).toHaveBeenCalledOnce();
    expect(redisInstance.quit).toHaveBeenCalledOnce();
  });
});