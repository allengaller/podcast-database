import fs from 'fs-extra';
import path from 'path';
import { LeetCodeProblem } from '../types/leetcode';

export class CacheManager {
  private static readonly CACHE_DIR = path.join(process.cwd(), 'data');
  private static readonly CACHE_FILE = path.join(this.CACHE_DIR, 'problems-cache.json');

  static async loadCache(): Promise<LeetCodeProblem[]> {
    if (await fs.pathExists(this.CACHE_FILE)) {
      try {
        // fs-extra's readJson returns `Promise<unknown>`; we trust the file
        // format we wrote in saveCache and assert the shape at the boundary.
        const raw = (await fs.readJson(this.CACHE_FILE)) as LeetCodeProblem[];
        return raw;
      } catch (error) {
        console.error('Failed to read cache file:', error);
        return [];
      }
    }
    return [];
  }

  static async saveCache(problems: LeetCodeProblem[]): Promise<void> {
    await fs.ensureDir(this.CACHE_DIR);
    await fs.writeJson(this.CACHE_FILE, problems, { spaces: 2 });
  }

  static async clearCache(): Promise<void> {
    if (await fs.pathExists(this.CACHE_FILE)) {
      await fs.remove(this.CACHE_FILE);
    }
  }

  static getCachePath(): string {
    return this.CACHE_FILE;
  }
}
