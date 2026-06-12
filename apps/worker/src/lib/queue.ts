import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { generatePodcastJob } from '../jobs/generate-podcast';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const podcastQueue = new Queue('podcast-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30_000,
    },
    removeOnComplete: { age: 7 * 24 * 3600, count: 200 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

export const podcastWorker = new Worker(
  'podcast-generation',
  async (job) => {
    return generatePodcastJob(job);
  },
  { connection: redis, concurrency: 2 }
);

podcastWorker.on('completed', (job) => {
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'job_completed',
      jobId: job.id,
      problemId: job.data.problemId,
      duration: job.processedOn ? Date.now() - job.processedOn : undefined,
    })
  );
});

podcastWorker.on('failed', (job, err) => {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'job_failed',
      jobId: job?.id,
      problemId: job?.data.problemId,
      attempt: job?.attemptsMade,
      maxAttempts: job?.opts?.attempts,
      errorName: err.name,
      errorMessage: err.message,
      willRetry: (job?.attemptsMade ?? 0) < (job?.opts?.attempts ?? 1),
    })
  );
});
