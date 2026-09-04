import { LeetCodeProblem } from '../types/leetcode';
import OpenAI from 'openai';
import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs-extra';
import path from 'path';

export interface PodcastEpisode {
  problemId: string;
  title: string;
  audioUrl: string;
  duration: string;
  transcript: string;
}

export class MCPService {
  private static _openai: OpenAI | null = null;
  private static _elevenlabs: ElevenLabsClient | null = null;

  /**
   * Lazily build the OpenAI client. We delay construction until the first
   * real call so importing this module (e.g. from tests, MCP server, or
   * worker) does NOT require OPENAI_API_KEY to be set.
   */
  private static get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
      });
    }
    return this._openai;
  }

  private static get elevenlabs(): ElevenLabsClient {
    if (!this._elevenlabs) {
      this._elevenlabs = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY,
      });
    }
    return this._elevenlabs;
  }

  static async generatePodcast(problem: LeetCodeProblem): Promise<PodcastEpisode> {
    console.log(`[MCP] Requesting podcast generation for: ${problem.title}...`);

    const apiKey = process.env.OPENAI_API_KEY;
    const elApiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey || !elApiKey) {
      console.warn('[MCP] Missing API keys, falling back to mock implementation.');
      return this.generateMockPodcast(problem);
    }

    try {
      const script = await this.generateScript(problem);
      const audioPath = await this.generateAudio(script, problem.id);

      return {
        problemId: problem.id,
        title: `LeetCast Episode ${problem.id}: ${problem.title}`,
        audioUrl: audioPath,
        duration: this.estimateDuration(script),
        transcript: script,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] Error in podcast generation: ${errorMessage}`);
      throw new Error(`Failed to generate podcast: ${errorMessage}`);
    }
  }

  private static async generateScript(problem: LeetCodeProblem): Promise<string> {
    const prompt = `
    You are an expert technical podcast host. Create a 2-3 minute engaging podcast script explaining the LeetCode problem: "${problem.title}".

    Problem Description:
    ${problem.description}

    Difficulty: ${problem.difficulty}
    Topics: ${problem.topics.join(', ')}

    The script should:
    1. Start with a catchy intro: "Welcome to LeetCast! Today we're diving into..."
    2. Explain the problem clearly in plain English.
    3. Discuss the core intuition or a common approach (like ${problem.topics[0]}).
    4. Mention the time and space complexity.
    5. End with an encouraging outro.

    Format: Return ONLY the spoken text. No stage directions, no [Music], no host names. Just the words to be spoken.
    `;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    return content || '';
  }

  private static async generateAudio(text: string, problemId: string): Promise<string> {
    const downloadDir = path.resolve(process.cwd(), 'downloads');
    await fs.ensureDir(downloadDir);
    const safeId = problemId.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `lc-${safeId}.mp3`;
    const filePath = path.join(downloadDir, fileName);
    if (!path.resolve(filePath).startsWith(downloadDir + path.sep)) {
      throw new Error(`generateAudio: path escapes downloads dir: ${filePath}`);
    }

    if (await fs.pathExists(filePath)) {
      return filePath;
    }

    const audioStream = await this.elevenlabs.generate({
      voice: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpg8n9YZpUI0j',
      text: text,
      model_id: 'eleven_multilingual_v2',
    });

    await this.pipeAudioStream(audioStream, fs.createWriteStream(filePath));

    return filePath;
  }

  /**
   * Pipe an audio stream (Buffer, ReadableStream, or AsyncIterable) into an
   * already-created file stream. Takes no path: path handling stays in generateAudio.
   */
  private static async pipeAudioStream(
    stream: unknown,
    fileStream: ReturnType<typeof fs.createWriteStream>
  ): Promise<void> {
    if (Buffer.isBuffer(stream)) {
      await new Promise<void>((resolve, reject) => {
        fileStream.on('error', reject);
        fileStream.end(stream, () => resolve());
      });
      return;
    }

    if (stream && typeof (stream as NodeJS.ReadableStream).pipe === 'function') {
      (stream as NodeJS.ReadableStream).pipe(fileStream);
      return new Promise<void>((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
    }

    if (stream && typeof (stream as AsyncIterable<Buffer>)[Symbol.asyncIterator] === 'function') {
      for await (const chunk of stream as AsyncIterable<Buffer>) {
        if (!fileStream.write(chunk)) {
          await new Promise<void>((resolve) => fileStream.once('drain', () => resolve()));
        }
      }
      await new Promise<void>((resolve, reject) => {
        fileStream.on('error', reject);
        fileStream.end(() => resolve());
      });
      return;
    }

    throw new Error('Unexpected audio stream type from ElevenLabs');
  }

  private static estimateDuration(text: string): string {
    const words = text.split(/\s+/).length;
    const minutes = Math.floor(words / 150);
    const seconds = Math.floor((words % 150) / (150 / 60));
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private static generateMockPodcast(problem: LeetCodeProblem): PodcastEpisode {
    return {
      problemId: problem.id,
      title: `LeetCast Episode ${problem.id}: ${problem.title} (Mock)`,
      audioUrl: `https://example.com/audio/lc-${problem.id}.mp3`,
      duration: '1:30',
      transcript: `[MOCK] Welcome to LeetCast. Today we are discussing ${problem.title}. ${problem.description}...`,
    };
  }
}
