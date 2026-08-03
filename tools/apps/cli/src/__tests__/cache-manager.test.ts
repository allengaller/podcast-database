import { CacheManager } from '../utils/cache-manager';
import fs from 'fs-extra';

jest.mock('fs-extra');

describe('CacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadCache', () => {
    it('should return empty array if cache file does not exist', async () => {
      (fs.pathExists as jest.Mock).mockResolvedValue(false);

      const result = await CacheManager.loadCache();
      expect(result).toEqual([]);
    });

    it('should return cached data if file exists', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test Problem',
          titleSlug: 'test-problem',
          difficulty: 'Easy',
          topics: ['Array'],
          description: 'Test description',
          acceptanceRate: '50%',
        },
      ];

      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      (fs.readJson as jest.Mock).mockResolvedValue(mockData);

      const result = await CacheManager.loadCache();
      expect(result).toEqual(mockData);
    });
  });

  describe('saveCache', () => {
    it('should save data to cache file', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test Problem',
          titleSlug: 'test-problem',
          difficulty: 'Easy',
          topics: ['Array'],
          description: 'Test description',
          acceptanceRate: '50%',
        },
      ];

      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeJson as jest.Mock).mockResolvedValue(undefined);

      await CacheManager.saveCache(mockData);

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeJson).toHaveBeenCalled();
    });
  });
});
