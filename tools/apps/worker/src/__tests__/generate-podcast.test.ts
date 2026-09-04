import { generatePodcastJob } from '../jobs/generate-podcast';
import { Job } from 'bullmq';

jest.mock('@leetcast/core', () => ({
  PodcastEngine: jest.fn().mockImplementation(() => ({
    generatePodcast: jest.fn().mockResolvedValue({
      title: 'LeetCast 每日一题 | 1. Two Sum',
      transcript: 'Mock transcript for Two Sum',
      duration: 300,
      audioPath: '/tmp/podcast-1.mp3',
      chapters: [
        { time: 0, title: '开场' },
        { time: 60, title: '题目介绍' },
      ],
    }),
  })),
  StorageService: {
    uploadFile: jest.fn().mockResolvedValue('https://storage.example.com/podcasts/1/audio.mp3'),
  },
}));

jest.mock('@leetcast/database', () => ({
  prisma: {
    problem: {
      findUnique: jest.fn(),
    },
    podcast: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('fs-extra', () => ({
  remove: jest.fn().mockResolvedValue(undefined),
}));

const { prisma } = jest.requireMock('@leetcast/database');
const { StorageService } = jest.requireMock('@leetcast/core');

function createMockJob(data: Record<string, unknown>): Job {
  return {
    id: 'test-job-1',
    data,
    updateProgress: jest.fn().mockResolvedValue(undefined),
  } as unknown as Job;
}

describe('generatePodcastJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a podcast generation job successfully', async () => {
    prisma.problem.findUnique.mockResolvedValue({
      id: '1',
      title: 'Two Sum',
      difficulty: 'Easy',
    });

    prisma.podcast.create.mockResolvedValue({
      id: 'podcast-1',
      problemId: '1',
      title: 'LeetCast 每日一题 | 1. Two Sum',
    });

    const job = createMockJob({ problemId: '1' });
    const result = await generatePodcastJob(job);

    expect(result.podcastId).toBe('podcast-1');
    expect(result.audioUrl).toContain('storage.example.com');
    expect(job.updateProgress).toHaveBeenCalledTimes(5);
    expect(StorageService.uploadFile).toHaveBeenCalled();
    expect(prisma.podcast.create).toHaveBeenCalled();
  });

  it('should throw when problem is not found', async () => {
    prisma.problem.findUnique.mockResolvedValue(null);

    const job = createMockJob({ problemId: '999' });
    await expect(generatePodcastJob(job)).rejects.toThrow('Problem 999 not found');
  });

  it('should clear previous daily flag when generating daily podcast', async () => {
    prisma.problem.findUnique.mockResolvedValue({ id: '1', title: 'Two Sum' });
    prisma.podcast.create.mockResolvedValue({ id: 'podcast-1' });

    const job = createMockJob({ problemId: '1', isDaily: true, dailyDate: '2026-06-12' });
    await generatePodcastJob(job);

    expect(prisma.podcast.updateMany).toHaveBeenCalledWith({
      where: { isDaily: true },
      data: { isDaily: false },
    });
  });

  it('should not clear daily flag for non-daily podcasts', async () => {
    prisma.problem.findUnique.mockResolvedValue({ id: '1', title: 'Two Sum' });
    prisma.podcast.create.mockResolvedValue({ id: 'podcast-1' });

    const job = createMockJob({ problemId: '1', isDaily: false });
    await generatePodcastJob(job);

    expect(prisma.podcast.updateMany).not.toHaveBeenCalled();
  });
});
