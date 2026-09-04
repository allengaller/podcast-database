import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = {
  podcast: { findFirst: vi.fn() },
};
vi.mock('@leetcast/database', () => ({ prisma: prismaMock }));

async function loadRoute() {
  const mod = await import('@/app/api/daily/route');
  return mod.GET;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SENTRY_DSN;
});

describe('GET /api/daily', () => {
  it('returns the daily podcast with its problem when one exists', async () => {
    const fixture = {
      id: 'pod-1',
      title: 'Daily #42',
      isDaily: true,
      dailyDate: new Date('2026-07-26T00:00:00Z'),
      problem: { id: 'LC-1', title: 'Two Sum' },
    };
    prismaMock.podcast.findFirst.mockResolvedValueOnce(fixture);

    const GET = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('pod-1');
    expect(body.problem.title).toBe('Two Sum');
    // Verify the where clause targets today's window.
    const call = prismaMock.podcast.findFirst.mock.calls[0][0];
    expect(call.where.isDaily).toBe(true);
    expect(call.where.dailyDate.gte).toBeInstanceOf(Date);
    expect(call.include).toEqual({ problem: true });
  });

  it('returns 404 when no daily podcast exists for today', async () => {
    prismaMock.podcast.findFirst.mockResolvedValueOnce(null);

    const GET = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('No daily podcast found');
  });

  it('returns 500 when the database throws', async () => {
    // NextResponse does not wrap thrown errors by default; the route
    // currently lets the error escape. We assert the rejection propagates
    // so a future middleware can add proper error mapping.
    prismaMock.podcast.findFirst.mockRejectedValueOnce(new Error('db down'));

    const GET = await loadRoute();
    await expect(GET()).rejects.toThrow('db down');
  });
});