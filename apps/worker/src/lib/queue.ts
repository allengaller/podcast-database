import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { generatePodcastJob, GeneratePodcastJobData } from '../jobs/generate-podcast';
import { reportError } from './sentry';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const podcastQueue = new Queue<GeneratePodcastJobData>('podcast-generation', {
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

export const podcastWorker = new Worker<GeneratePodcastJobData>(
  'podcast-generation',
  async (job) => {
    return generatePodcastJob(job);
  },
  { connection: redis, concurrency: 2 }
);

podcastWorker.on('completed', (job: Job<GeneratePodcastJobData>) => {
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

podcastWorker.on('failed', (job: Job<GeneratePodcastJobData> | undefined, err: Error) => {
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
  // Report to Sentry on the final attempt only; intermediate retries are noise.
  if ((job?.attemptsMade ?? 0) >= (job?.opts?.attempts ?? 1)) {
    reportError(err, {
      jobId: job?.id,
      problemId: job?.data.problemId,
      attempts: job?.attemptsMade,
    });
  }
});
