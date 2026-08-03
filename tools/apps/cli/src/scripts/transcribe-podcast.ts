#!/usr/bin/env ts-node
/**
 * End-to-end driver:
 *   1. Download an Apple Podcasts (or any yt-dlp-supported) URL to ./downloads
 *   2. Upload the audio to the project MinIO/S3 bucket to get a public URL
 *   3. Submit the URL to 通义听悟 for transcription
 *   4. Poll for completion and fetch the transcript
 *   5. Render the transcript as markdown with metadata and save to ./data
 *
 * Usage:
 *   pnpm transcribe --url <podcast-url> --title "<episode title>"
 *   pnpm transcribe --url <podcast-url> --title "..." --hosts "Terry,Daniel" --guests "Justin"
 *
 * Env:
 *   ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET, TINGWU_APP_KEY  -- required
 *   S3_ENDPOINT, S3_PUBLIC_URL, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY -- from .env
 */
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import chalk from 'chalk';
import { StorageService } from '@leetcast/core';
import { TingwuService } from '@leetcast/core';
import { formatDuration, toMarkdown } from '@leetcast/core';

const execFileAsync = promisify(execFile);

interface Args {
  url: string;
  title: string;
  podcast?: string;
  hosts?: string;
  guests?: string;
  language?: string;
  tags?: string;
  hotwords?: string;
  chapter?: boolean;
  outDir?: string;
  downloadsDir?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const bool = (flag: string): boolean => argv.includes(flag);

  const url = get('--url');
  const title = get('--title');
  if (!url || !title) {
    console.error(chalk.red('Usage: transcribe --url <podcast-url> --title "<episode title>"'));
    console.error(
      chalk.gray(
        'Optional: --podcast <name> --hosts "A,B" --guests "X,Y" --tags "t1,t2" --hotwords "kw1,kw2" --chapter'
      )
    );
    process.exit(2);
  }
  return {
    url,
    title,
    podcast: get('--podcast'),
    hosts: get('--hosts'),
    guests: get('--guests'),
    language: get('--language'),
    tags: get('--tags'),
    hotwords: get('--hotwords'),
    chapter: bool('--chapter'),
    outDir: get('--out-dir') ?? path.resolve(process.cwd(), 'data'),
    downloadsDir: get('--downloads-dir') ?? path.resolve(process.cwd(), 'downloads'),
  };
}

async function downloadWithYtDlp(url: string, outDir: string): Promise<string> {
  await fs.ensureDir(outDir);
  const spinner = ora(`Downloading audio with yt-dlp`).start();
  try {
    // yt-dlp picks the best audio-only format and writes to <outDir>/%(title)s.%(ext)s
    await execFileAsync(
      'yt-dlp',
      [
        '--no-playlist',
        '--no-mtime',
        '-x', // extract audio
        '--audio-format',
        'm4a',
        '--audio-quality',
        '0',
        '-o',
        path.join(outDir, '%(title)s.%(ext)s'),
        url,
      ],
      { maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (err) {
    spinner.fail(chalk.red('yt-dlp download failed'));
    throw err;
  }

  // Find the most-recently modified .m4a in outDir.
  const entries = await fs.readdir(outDir);
  const candidates = await Promise.all(
    entries
      .filter((f) => /\.(m4a|mp3|wav|opus)$/i.test(f))
      .map(async (f) => {
        const stat = await fs.stat(path.join(outDir, f));
        return { path: path.join(outDir, f), mtime: stat.mtimeMs };
      })
  );
  candidates.sort((a, b) => b.mtime - a.mtime);
  if (candidates.length === 0) {
    throw new Error(`yt-dlp reported success but no audio file appeared in ${outDir}`);
  }
  spinner.succeed(chalk.green(`Downloaded: ${path.basename(candidates[0].path)}`));
  return candidates[0].path;
}

async function uploadAudio(localPath: string): Promise<string> {
  const spinner = ora('Uploading audio to MinIO/S3').start();
  const key = `podcast-transcripts/${Date.now()}-${path.basename(localPath)}`;
  try {
    const url = await StorageService.uploadFile(localPath, key, 'audio/mp4');
    spinner.succeed(chalk.green(`Uploaded: ${url}`));
    return url;
  } catch (err) {
    spinner.fail(chalk.red('Upload failed'));
    throw err;
  }
}

async function submitTranscription(args: Args, audioUrl: string): Promise<string> {
  const spinner = ora('Submitting to 通义听悟').start();
  try {
    const taskId = await TingwuService.submitTask({
      audioUrl,
      language: args.language ?? 'zh-CN',
      speakerDiarization: true,
      autoPunctuation: true,
      chapterDetection: args.chapter ?? false,
      hotwords: args.hotwords
        ? args.hotwords
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    });
    spinner.succeed(chalk.green(`Submitted task: ${taskId}`));
    return taskId;
  } catch (err) {
    spinner.fail(chalk.red('Submit failed'));
    throw err;
  }
}

async function waitForTranscription(
  taskId: string
): Promise<ReturnType<typeof TingwuService.parseTranscription>> {
  const spinner = ora('Waiting for 通义听悟 to finish').start();
  const start = Date.now();
  const status = await TingwuService.waitForCompletion(taskId, {
    intervalMs: 8000,
    timeoutMs: 30 * 60 * 1000,
  });
  spinner.succeed(chalk.green(`Completed in ${formatDuration(Date.now() - start)}`));
  return TingwuService.parseTranscription(status);
}

function buildFilename(title: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = title
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${stamp}-${safe}.md`;
}

async function writeMarkdown(
  args: Args,
  result: ReturnType<typeof TingwuService.parseTranscription>,
  taskId: string
): Promise<string> {
  const filename = buildFilename(args.title);
  const outPath = path.join(args.outDir!, filename);
  await fs.ensureDir(args.outDir!);

  const { markdown } = toMarkdown(result, {
    title: args.title,
    podcast: args.podcast ?? 'Teahour',
    sourceUrl: args.url,
    hosts: args.hosts
      ? args.hosts
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    guests: args.guests
      ? args.guests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    tags: args.tags
      ? args.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : ['podcast', 'transcript'],
    extraFrontmatter: { tingwu_task_id: taskId },
  });

  await fs.writeFile(outPath, markdown, 'utf8');
  console.log(chalk.green(`✅ Wrote transcript: ${outPath}`));
  return outPath;
}

async function main() {
  const args = parseArgs();
  console.log(chalk.bold.cyan(`\n🎙  Transcribing: ${args.title}\n`));

  const audioPath = await downloadWithYtDlp(args.url, args.downloadsDir!);
  const audioUrl = await uploadAudio(audioPath);
  const taskId = await submitTranscription(args, audioUrl);
  const result = await waitForTranscription(taskId);
  const mdPath = await writeMarkdown(args, result, taskId);

  console.log(chalk.bold('\nSummary'));
  console.log(`  Audio:   ${audioPath}`);
  console.log(`  Upload:  ${audioUrl}`);
  console.log(`  Task:    ${taskId}`);
  console.log(`  Output:  ${mdPath}`);
}

main().catch((err) => {
  console.error(chalk.red(`\n❌ ${err instanceof Error ? err.message : String(err)}`));
  if (err instanceof Error && err.stack) console.error(chalk.gray(err.stack));
  process.exit(1);
});
