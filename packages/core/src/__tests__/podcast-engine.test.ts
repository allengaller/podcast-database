import { PodcastEngine } from '../services/podcast-engine';
import { LeetCodeProblem } from '../types/leetcode';

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: [
                  '[HOST] 大家好，欢迎收听 LeetCast 每日一题！',
                  '[HOST] 今天我们要聊的是 Two Sum，一道非常经典的入门题。',
                  '[ENGINEER] 是的，这道题的核心思路是用哈希表来存储已经遍历过的值。',
                  '[ENGINEER] 我们遍历数组的时候，检查 target 减去当前值是否在哈希表中。',
                  '[HOST] 时间复杂度怎么样？',
                  '[ENGINEER] 时间复杂度是 O(n)，空间复杂度也是 O(n)。',
                  '[HOST] 好的，今天的内容就到这里，记得打卡！',
                ].join('\n'),
              },
            },
          ],
        }),
      },
    },
  })),
}));

jest.mock('elevenlabs', () => ({
  ElevenLabsClient: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue(Buffer.from('mock-audio-bytes')),
  })),
}));

jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(false),
  writeFile: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn((event: string, cb: () => void) => {
      if (event === 'finish') setTimeout(cb, 0);
    }),
    write: jest.fn(),
  }),
}));

jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
    cb(null, { stdout: '5.0\n', stderr: '' });
  }),
}));

const mockProblem: LeetCodeProblem = {
  id: '1',
  title: 'Two Sum',
  titleSlug: 'two-sum',
  difficulty: 'Easy',
  topics: ['Array', 'Hash Table'],
  description: '<p>Given an array of integers nums and an integer target</p>',
  acceptanceRate: '50.1%',
};

describe('PodcastEngine', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('mock mode (no API keys)', () => {
    it('should generate mock podcast when no API keys', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const engine = new PodcastEngine();
      const result = await engine.generatePodcast(mockProblem);

      expect(result.title).toContain('Two Sum');
      expect(result.title).toContain('Mock');
      expect(result.duration).toBe(5);
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0].title).toBe('开场');
      expect(result.transcript).toContain('Two Sum');
    });
  });

  describe('full generation (mocked APIs)', () => {
    it('should generate podcast with dialogue, chapters, and audio', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ELEVENLABS_API_KEY = 'test-key';

      const engine = new PodcastEngine();
      const result = await engine.generatePodcast(mockProblem);

      expect(result.title).toContain('Two Sum');
      expect(result.title).not.toContain('Mock');
      expect(result.transcript).toContain('主持人');
      expect(result.transcript).toContain('工程师');
      expect(result.transcript).toContain('哈希表');
      expect(result.chapters.length).toBeGreaterThanOrEqual(1);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should detect chapter markers from dialogue keywords', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ELEVENLABS_API_KEY = 'test-key';

      const engine = new PodcastEngine();
      const result = await engine.generatePodcast(mockProblem);

      const chapterTitles = result.chapters.map((c) => c.title);
      expect(chapterTitles).toContain('开场');
    });
  });

  describe('HTML stripping in transcript', () => {
    it('should strip HTML tags from problem description in mock mode', async () => {
      delete process.env.OPENAI_API_KEY;

      const engine = new PodcastEngine();
      const result = await engine.generatePodcast(mockProblem);

      expect(result.transcript).not.toContain('<p>');
      expect(result.transcript).not.toContain('</p>');
      expect(result.transcript).toContain('Given an array');
    });
  });
});
