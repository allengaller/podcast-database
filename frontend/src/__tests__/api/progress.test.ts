import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const prismaMock = {
  playHistory: { upsert: vi.fn() },
  checkIn: { upsert: vi.fn() },
  userProgress: { findUnique: vi.fn(), upsert: vi.fn() },
};
vi.mock('@leetcast/database', () => ({ prisma: prismaMock }));

const authMock = vi.fn();
vi.mock('@/auth', () => ({ auth: authMock }));

// Mock rate-limit so each test gets a fresh, programmable limiter without
// depending on the in-memory Map shared across tests.
const rateLimitMock = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ rateLimit: rateLimitMock }));

function makeReq(body: unknown) {
  return new Request('http://localhost/api/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function loadRoute() {
  const mod = await import('@/app/api/progress/route');
  return mod.POST;
}

beforeEach(() => {
  vi.resetAllMocks();
  // Default rate-limit behavior: allow all requests. Tests that exercise
  // the 429 path override this with mockReturnValueOnce.
  rateLimitMock.mockReturnValue({ allowed: true, remaining: 30 });
  // Pin the fake clock so streak math is deterministic.
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-26T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/progress', () => {
  it('returns 401 when no session is present', async () => {
    authMock.mockResolvedValueOnce(null);
    const POST = await loadRoute();
    const res = await POST(makeReq({ podcastId: 'p1', progress: 30 }) as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when body is not valid JSON', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const POST = await loadRoute();
    const res = await POST(makeReq('not-json') as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 when podcastId is empty', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const POST = await loadRoute();
    const res = await POST(makeReq({ podcastId: '', progress: 30 }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 when progress is negative', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const POST = await loadRoute();
    const res = await POST(makeReq({ podcastId: 'p1', progress: -1 }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 429 when per-user rate limit is exceeded (30/min)', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, retryAfter: 42 });
    prismaMock.playHistory.upsert.mockResolvedValueOnce({});

    const POST = await loadRoute();
    const res = await POST(makeReq({ podcastId: 'p1', progress: 30 }) as never);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    // No persistence should happen when rate-limited.
    expect(prismaMock.playHistory.upsert).not.toHaveBeenCalled();
  });

  it('persists progress for a non-completed update', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    prismaMock.playHistory.upsert.mockResolvedValueOnce({ id: 'h-1', progress: 30 });

    const POST = await loadRoute();
    const res = await POST(makeReq({ podcastId: 'p1', progress: 30 }) as never);
    expect(res.status).toBe(200);

    expect(prismaMock.playHistory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_podcastId: { userId: 'u1', podcastId: 'p1' } },
        update: { progress: 30, completed: false },
        create: { userId: 'u1', podcastId: 'p1', progress: 30, completed: false },
      })
    );
    // completed=false should NOT touch check-in or userProgress
    expect(prismaMock.checkIn.upsert).not.toHaveBeenCalled();
    expect(prismaMock.userProgress.findUnique).not.toHaveBeenCalled();
  });

  it('increments streak when completed and last check-in was yesterday', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    prismaMock.playHistory.upsert.mockResolvedValueOnce({ progress: 100 });
    prismaMock.userProgress.findUnique.mockResolvedValueOnce({
      currentStreak: 4,
      longestStreak: 5,
      lastCheckInDate: new Date('2026-07-25T00:00:00Z'),
    });

    const POST = await loadRoute();
    const res = await POST(makeReq({ podcastId: 'p1', progress: 100, completed: true }) as never);
    expect(res.status).toBe(200);

    expect(prismaMock.checkIn.upsert).toHaveBeenCalledOnce();
    // streak should bump from 4 to 5
    expect(prismaMock.userProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ currentStreak: 5 }),
      })
    );
  });

  it('resets streak to 1 when last check-in was older than yesterday', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    prismaMock.playHistory.upsert.mockResolvedValueOnce({ progress: 100 });
    prismaMock.userProgress.findUnique.mockResolvedValueOnce({
      currentStreak: 9,
      longestStreak: 9,
      lastCheckInDate: new Date('2026-07-20T00:00:00Z'), // 6 days ago
    });

    const POST = await loadRoute();
    await POST(makeReq({ podcastId: 'p1', progress: 100, completed: true }) as never);

    expect(prismaMock.userProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ currentStreak: 1 }),
      })
    );
  });

  it('starts streak at 1 for a brand-new user completing first episode', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u-fresh' } });
    prismaMock.playHistory.upsert.mockResolvedValueOnce({ progress: 100 });
    prismaMock.userProgress.findUnique.mockResolvedValueOnce(null);

    const POST = await loadRoute();
    await POST(makeReq({ podcastId: 'p1', progress: 100, completed: true }) as never);

    expect(prismaMock.userProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ currentStreak: 1, longestStreak: 1, totalCompleted: 1 }),
      })
    );
  });
});