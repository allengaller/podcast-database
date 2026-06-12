import { MCPService } from '../services/mcp';
import { LeetCodeProblem } from '../types/leetcode';

// Mock OpenAI and ElevenLabs
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock podcast script about Two Sum.' } }],
          }),
        },
      },
    })),
  };
});

jest.mock('elevenlabs', () => ({
  ElevenLabsClient: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue(Buffer.from('mock-audio-data')),
  })),
}));

jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(false),
  writeFile: jest.fn().mockResolvedValue(undefined),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn(),
    write: jest.fn(),
  }),
}));

const mockProblem: LeetCodeProblem = {
  id: '1',
  title: 'Two Sum',
  titleSlug: 'two-sum',
  difficulty: 'Easy',
  topics: ['Array', 'Hash Table'],
  description: 'Given an array of integers nums and an integer target...',
  acceptanceRate: '50.1%',
};

describe('MCPService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generatePodcast', () => {
    it('should generate mock podcast when API keys are missing', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const result = await MCPService.generatePodcast(mockProblem);

      expect(result.problemId).toBe('1');
      expect(result.title).toContain('Two Sum');
      expect(result.title).toContain('Mock');
      expect(result.audioUrl).toContain('example.com');
      expect(result.transcript).toContain('Two Sum');
    });

    it('should generate real podcast when API keys are present', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ELEVENLABS_API_KEY = 'test-key';

      const result = await MCPService.generatePodcast(mockProblem);

      expect(result.problemId).toBe('1');
      expect(result.title).toContain('Two Sum');
      expect(result.transcript).toContain('Mock podcast script');
      expect(result.duration).toMatch(/\d+:\d{2}/);
    });

    it('should include problem metadata in the result', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await MCPService.generatePodcast(mockProblem);

      expect(result.problemId).toBe('1');
      expect(result.duration).toBeDefined();
    });
  });
});
