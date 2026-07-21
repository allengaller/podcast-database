import { Job } from 'bullmq';
import { PodcastEngine, LeetCodeProblem, StorageService } from '@leetcast/core';
import { prisma, Prisma } from '@leetcast/database';
import fs from 'fs-extra';

export interface GeneratePodcastJobData {
  problemId: string;
  isDaily?: boolean;
  dailyDate?: string;
}

const engine = new PodcastEngine();

export async function generatePodcastJob(job: Job<GeneratePodcastJobData>) {
  const { problemId, isDaily, dailyDate } = job.data;

  await job.updateProgress(10);

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });

  if (!problem) {
    throw new Error(`Problem ${problemId} not found`);
  }

  await job.updateProgress(20);

  const result = await engine.generatePodcast(problem as LeetCodeProblem);

  await job.updateProgress(70);

  const storageKey = `podcasts/${problemId}/${Date.now()}.mp3`;
  const audioUrl = await StorageService.uploadFile(result.audioPath, storageKey, 'audio/mpeg');

  await job.updateProgress(90);

  if (isDaily) {
    await prisma.podcast.updateMany({
      where: { isDaily: true },
      data: { isDaily: false },
    });
  }

  const podcast = await prisma.podcast.create({
    data: {
      problemId,
      title: result.title,
      audioUrl,
      duration: result.duration,
      transcript: result.transcript,
      chapters: result.chapters as Prisma.InputJsonValue,
      isDaily: isDaily || false,
      dailyDate: dailyDate ? new Date(dailyDate) : null,
      status: 'ready',
    },
  });

  try {
    await fs.remove(result.audioPath);
  } catch (cleanupError) {
    console.error(`[Worker] Failed to cleanup temp file ${result.audioPath}:`, cleanupError);
  }

  await job.updateProgress(100);

  return { podcastId: podcast.id, audioUrl };
}
