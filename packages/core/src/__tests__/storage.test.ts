import { StorageService } from '../services/storage';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs-extra';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('fs-extra', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(),
  },
}));

const S3ClientMock = S3Client as unknown as jest.Mock;
const PutCommandMock = PutObjectCommand as unknown as jest.Mock;
const GetCommandMock = GetObjectCommand as unknown as jest.Mock;
const getSignedUrlMock = getSignedUrl as unknown as jest.Mock;
const fsReadFileMock = fs.readFile as unknown as jest.Mock;

describe('StorageService', () => {
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_BUCKET = 'leetcast';
    process.env.S3_PUBLIC_URL = 'http://localhost:9000';
    process.env.S3_ACCESS_KEY = 'minioadmin';
    process.env.S3_SECRET_KEY = 'minioadmin';
    process.env.S3_REGION = 'us-east-1';

    sendMock = jest.fn().mockResolvedValue({});
    // StorageService constructs an S3Client in a static field; replace the
    // shared instance's `send` via prototype so the test isolates behavior.
    S3ClientMock.mockImplementation(() => ({ send: sendMock }));
    // Force the static `s3` field to pick up the latest mock implementation
    (StorageService as unknown as { s3: unknown }).s3 = new (S3Client as unknown as new () => unknown)();
  });

  describe('uploadFile', () => {
    it('uploads the file body and returns a public URL', async () => {
      const body = Buffer.from('hello');
      fsReadFileMock.mockResolvedValueOnce(body);
      sendMock.mockResolvedValueOnce({});

      const url = await StorageService.uploadFile('/tmp/x.mp3', 'podcasts/x.mp3', 'audio/mpeg');

      expect(fs.readFile).toHaveBeenCalledWith('/tmp/x.mp3');
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'leetcast',
          Key: 'podcasts/x.mp3',
          Body: body,
          ContentType: 'audio/mpeg',
        })
      );
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(url).toBe('http://localhost:9000/leetcast/podcasts/x.mp3');
    });

    it('defaults ContentType to audio/mpeg when not provided', async () => {
      fsReadFileMock.mockResolvedValueOnce(Buffer.from('a'));
      sendMock.mockResolvedValueOnce({});

      await StorageService.uploadFile('/tmp/x.mp3', 'podcasts/x.mp3');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'audio/mpeg' })
      );
    });
  });

  describe('uploadBuffer', () => {
    it('uploads a buffer directly and returns a public URL', async () => {
      sendMock.mockResolvedValueOnce({});
      const url = await StorageService.uploadBuffer(Buffer.from('x'), 'k.bin', 'application/octet-stream');

      expect(fs.readFile).not.toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Key: 'k.bin', Body: expect.any(Buffer) })
      );
      expect(url).toBe('http://localhost:9000/leetcast/k.bin');
    });
  });

  describe('getSignedDownloadUrl', () => {
    it('uses default 1h expiry when not provided', async () => {
      getSignedUrlMock.mockResolvedValueOnce('https://signed.example/x');

      const url = await StorageService.getSignedDownloadUrl('podcasts/x.mp3');

      expect(GetCommandMock).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'leetcast', Key: 'podcasts/x.mp3' })
      );
      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 3600 });
      expect(url).toBe('https://signed.example/x');
    });

    it('respects custom expiry', async () => {
      getSignedUrlMock.mockResolvedValueOnce('https://signed.example/y');

      await StorageService.getSignedDownloadUrl('podcasts/y.mp3', 60);

      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 60 });
    });
  });
});
