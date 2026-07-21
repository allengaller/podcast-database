import { AudioService } from '../services/audio';
import axios from 'axios';
import fs from 'fs-extra';
import { exec } from 'child_process';

jest.mock('axios');
jest.mock('fs-extra', () => {
  const actual = jest.requireActual('fs-extra');
  return {
    __esModule: true,
    default: {
      ...actual,
      ensureDir: jest.fn().mockResolvedValue(undefined),
      pathExists: jest.fn(),
      writeFile: jest.fn().mockResolvedValue(undefined),
      createWriteStream: jest.fn(),
    },
    ...actual,
  };
});

jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  }));
});

jest.mock('chalk', () => {
  // chalk 4 exports a callable function with chained color helpers attached.
  // audio.ts uses chalk.red, chalk.green, chalk.yellow, chalk.cyan, chalk.dim.
  const identity = ((s: string) => s) as unknown as Record<string, unknown>;
  identity.red = (s: string) => s;
  identity.green = (s: string) => s;
  identity.yellow = (s: string) => s;
  identity.cyan = (s: string) => s;
  identity.dim = (s: string) => s;
  identity.bold = (s: string) => s;
  return { __esModule: true, default: identity };
});

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const axiosMock = axios as unknown as jest.Mock;
const fsMock = fs as jest.Mocked<typeof fs>;
const execMock = exec as unknown as jest.Mock;

const ORIGINAL_CWD = process.cwd();

/**
 * Build a fake writable stream. Auto-fires 'finish' on the next microtask
 * after each 'finish' listener registers, mimicking a stream that finishes
 * as soon as the consumer subscribes (since by the time `.pipe()` returns,
 * the data has already been written in this mock).
 */
function makeFakeWriter() {
  const finishHandlers: Array<() => void> = [];
  const errorHandlers: Array<(e: Error) => void> = [];
  const writer = {
    on(event: string, cb: (...args: unknown[]) => void) {
      if (event === 'finish') {
        finishHandlers.push(cb as () => void);
        Promise.resolve().then(() => finishHandlers.forEach((h) => h()));
      }
      if (event === 'error') errorHandlers.push(cb as (e: Error) => void);
      return writer;
    },
  };
  const stream = { pipe: jest.fn((w: typeof writer) => w) };
  return {
    writer,
    stream,
    fireError: (e: Error) => errorHandlers.forEach((h) => h(e)),
  };
}

describe('AudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.chdir(ORIGINAL_CWD);
  });

  describe('downloadAudio', () => {
    it('sanitizes parent-dir traversal to its basename (path.basename neutralizes `../`)', async () => {
      // path.basename('../../etc/passwd') === 'passwd' which is a valid filename,
      // so the service cannot really escape DOWNLOAD_DIR through this vector.
      // We assert the documented behavior: traversal segments are stripped and
      // the file lands safely under downloads/.
      fsMock.pathExists.mockResolvedValue(false as never);
      fsMock.writeFile.mockResolvedValueOnce(undefined as never);

      const out = await AudioService.downloadAudio('https://example.com/x.mp3', '../../etc/passwd');
      expect(out.endsWith('passwd')).toBe(true);
      expect(out).toContain('downloads');
    });

    it('rejects filenames that resolve to hidden files (start with .)', async () => {
      fsMock.pathExists.mockResolvedValue(false as never);
      await expect(
        AudioService.downloadAudio('https://cdn.example.com/x.mp3', '.secret')
      ).rejects.toThrow(/Invalid filename/);
    });

    it('sanitizes spaces and other disallowed chars into underscores', async () => {
      fsMock.pathExists.mockResolvedValue(false as never);
      fsMock.writeFile.mockResolvedValueOnce(undefined as never);

      // 'foo bar.mp3' -> sanitized to 'foo_bar.mp3', downloads via example.com mock
      const out = await AudioService.downloadAudio('https://example.com/x.mp3', 'foo bar.mp3');
      expect(out.endsWith('foo_bar.mp3')).toBe(true);
    });

    it('writes mock content for example.com URLs', async () => {
      fsMock.pathExists.mockResolvedValue(false as never);
      fsMock.writeFile.mockResolvedValueOnce(undefined as never);

      const out = await AudioService.downloadAudio('https://example.com/x.mp3', 'safe.mp3');

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(out.endsWith('safe.mp3')).toBe(true);
      expect(axiosMock).not.toHaveBeenCalled();
    });

    it('streams the response body for real URLs', async () => {
      fsMock.pathExists.mockResolvedValue(false as never);
      const { writer, stream } = makeFakeWriter();
      fsMock.createWriteStream.mockReturnValueOnce(writer as never);
      axiosMock.mockResolvedValueOnce({ data: stream });

      // Note: must NOT contain 'example.com' or downloadAudio takes the mock path.
      const out = await AudioService.downloadAudio(
        'https://cdn.s3.amazonaws.com/audio.mp3',
        'real.mp3'
      );

      expect(out.endsWith('real.mp3')).toBe(true);
      expect(stream.pipe).toHaveBeenCalledWith(writer);
      expect(fs.createWriteStream).toHaveBeenCalled();
    });

    it('propagates writer errors as rejections', async () => {
      fsMock.pathExists.mockResolvedValue(false as never);
      const errorWriter = {
        on(event: string, cb: (e?: Error) => void) {
          if (event === 'error') {
            Promise.resolve().then(() => cb(new Error('disk full')));
          }
          return errorWriter;
        },
      };
      fsMock.createWriteStream.mockReturnValueOnce(errorWriter as never);
      axiosMock.mockResolvedValueOnce({ data: { pipe: jest.fn() } });

      await expect(
        AudioService.downloadAudio('https://cdn.s3.amazonaws.com/audio.mp3', 'fail.mp3')
      ).rejects.toThrow(/disk full/);
    });

    it('reuses an existing local file without re-downloading', async () => {
      fsMock.pathExists.mockResolvedValue(true as never);
      const out = await AudioService.downloadAudio('https://example.com/x.mp3', 'already.mp3');
      expect(out.endsWith('already.mp3')).toBe(true);
      expect(axiosMock).not.toHaveBeenCalled();
      expect(fsMock.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('playAudio', () => {
    it('uses afplay on darwin', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      execMock.mockImplementation(((_cmd: string, cb: (err: null) => void) => {
        cb(null);
      }) as never);

      await AudioService.playAudio('/tmp/x.mp3');

      expect(execMock).toHaveBeenCalledWith(
        expect.stringContaining('afplay'),
        expect.any(Function)
      );
    });

    it('uses powershell on win32', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      execMock.mockImplementation(((_cmd: string, cb: (err: null) => void) => {
        cb(null);
      }) as never);

      await AudioService.playAudio('C:\\tmp\\x.mp3');

      expect(execMock).toHaveBeenCalledWith(
        expect.stringContaining('powershell'),
        expect.any(Function)
      );
    });

    it('falls back to play/aplay/mpg123 on linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      execMock.mockImplementation(((_cmd: string, cb: (err: null) => void) => {
        cb(null);
      }) as never);

      await AudioService.playAudio('/tmp/x.mp3');

      expect(execMock).toHaveBeenCalledWith(
        expect.stringMatching(/play|aplay|mpg123/),
        expect.any(Function)
      );
    });

    it('swallows killed exec errors silently (Ctrl+C)', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const err = Object.assign(new Error('killed'), { killed: true });
      execMock.mockImplementation(((_cmd: string, cb: (e: unknown) => void) => {
        cb(err);
      }) as never);

      // must not throw
      await AudioService.playAudio('/tmp/x.mp3');
    });

    it('logs and continues on non-killed exec errors', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const err = Object.assign(new Error('afplay: not found'), { killed: false });
      execMock.mockImplementation(((_cmd: string, cb: (e: unknown) => void) => {
        cb(err);
      }) as never);

      // must not throw
      await AudioService.playAudio('/tmp/x.mp3');
    });
  });

  describe('ensureDownloadDir', () => {
    it('creates the download directory', async () => {
      await AudioService.ensureDownloadDir();
      expect(fs.ensureDir).toHaveBeenCalled();
    });
  });
});
