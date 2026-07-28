import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the workspace database package: prisma + StrategyEngine.
const StrategyEngineMock = { selectDailyProblem: vi.fn() };
vi.mock('@leetcast/database', () => ({
  prisma: { $queryRaw: vi.fn() },
  StrategyEngine: StrategyEngineMock,
}));

// Mock BullMQ so the route handler never reaches Redis.
const queueAddMock = vi.fn();
vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({ add: queueAddMock })),
}));

// Mock ioredis (BullMQ uses it internally).
vi.mock('ioredis', () => ({ default: vi.fn() }));

// Mock next-auth's auth() helper.
const authMock = vi.fn();
vi.mock('@/auth', () => ({ auth: authMock }));

// Mock rate-limit so we don't depend on the in-memory Map leaking across tests.
const rateLimitMock = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ rateLimit: rateLimitMock }));

function makeReq(opts: { token?: string; ip?: string; body?: unknown } = {}) {
  const headers = new Headers();
  if (opts.token) headers.set('x-admin-token', opts.token);
  if (opts.ip) headers.set('x-forwarded-for', opts.ip);
  return new Request('http://localhost/api/admin/daily', {
    method: 'POST',
    headers,
    body: typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body ?? {}),
  });
}

async function loadRoute() {
  const mod = await import('@/app/api/admin/daily/route');
  return mod.POST;
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_TOKEN = 'correct-token';
  // Default: allow all requests. Tests for the 429 path override this.
  rateLimitMock.mockReturnValue({ allowed: true, remaining: 5 });
});

describe('POST /api/admin/daily', () => {
  it('rejects requests without an admin token with 403', async () => {
    const POST = await loadRoute();
    const res = await POST(makeReq() as never);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('rejects requests with a wrong admin token with 403', async () => {
    const POST = await loadRoute();
    const res = await POST(makeReq({ token: 'nope' }) as never);
    expect(res.status).toBe(403);
  });

  it('rejects when ADMIN_TOKEN env is unset (defense in depth)', async () => {
    delete process.env.ADMIN_TOKEN;
    const POST = await loadRoute();
    const res = await POST(makeReq({ token: 'correct-token' }) as never);
    expect(res.status).toBe(403);
  });

  it('returns 429 when IP exceeds rate limit (5/min)', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, retryAfter: 17 });
    const POST = await loadRoute();
    const blocked = await POST(
      makeReq({ token: 'correct-token', ip: '1.2.3.4', body: { strategy: 'progressive' } }) as never
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('17');
    // Auth/token checks should NOT have run.
    expect(StrategyEngineMock.selectDailyProblem).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid JSON body', async () => {
    const POST = await loadRoute();
    const res = await POST(makeReq({ token: 'correct-token', body: 'not-json' }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
  });

  it('returns 400 when strategy is not in the enum', async () => {
    const POST = await loadRoute();
    const res = await POST(
      makeReq({ token: 'correct-token', body: { strategy: 'random' } }) as never
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 404 when StrategyEngine returns no problem', async () => {
    StrategyEngineMock.selectDailyProblem.mockResolvedValueOnce(null);
    const POST = await loadRoute();
    const res = await POST(
      makeReq({ token: 'correct-token', body: { strategy: 'progressive' } }) as never
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('No problem found');
  });

  it('enqueues a generate-daily-podcast job and returns jobId + problemId', async () => {
    StrategyEngineMock.selectDailyProblem.mockResolvedValueOnce('LC-42');
    queueAddMock.mockResolvedValueOnce({ id: 'job-xyz' });

    const POST = await loadRoute();
    const res = await POST(
      makeReq({ token: 'correct-token', body: { strategy: 'progressive' } }) as never
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ jobId: 'job-xyz', problemId: 'LC-42' });

    expect(queueAddMock).toHaveBeenCalledWith(
      'generate-daily-podcast',
      expect.objectContaining({
        problemId: 'LC-42',
        isDaily: true,
        dailyDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );
  });

  it('uses explicit problemId when provided, bypassing StrategyEngine', async () => {
    queueAddMock.mockResolvedValueOnce({ id: 'job-abc' });

    const POST = await loadRoute();
    const res = await POST(
      makeReq({
        token: 'correct-token',
        body: { strategy: 'classic', problemId: 'LC-99' },
      }) as never
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.problemId).toBe('LC-99');
    expect(StrategyEngineMock.selectDailyProblem).not.toHaveBeenCalled();
  });
});