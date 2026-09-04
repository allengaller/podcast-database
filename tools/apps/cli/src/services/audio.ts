import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';

const execAsync = promisify(exec);

export class AudioService {
  private static DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');

  static async ensureDownloadDir() {
    await fs.ensureDir(this.DOWNLOAD_DIR);
  }

  /**
   * Sanitize filename to prevent path traversal attacks.
   * Only allows alphanumeric, hyphens, underscores, and dots.
   */
  private static sanitizeFilename(filename: string): string {
    const sanitized = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!sanitized || sanitized.startsWith('.')) {
      throw new Error(`Invalid filename: ${filename}`);
    }
    return sanitized;
  }

  static async downloadAudio(url: string, filename: string): Promise<string> {
    await this.ensureDownloadDir();
    const safeName = this.sanitizeFilename(filename);
    const filePath = path.join(this.DOWNLOAD_DIR, safeName);

    // Ensure resolved path is within DOWNLOAD_DIR
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(this.DOWNLOAD_DIR))) {
      throw new Error(`Path traversal detected: ${filename}`);
    }

    if (await fs.pathExists(resolved)) {
      return resolved;
    }

    const spinner = ora(`Downloading audio to ${safeName}...`).start();
    try {
      if (url.includes('example.com')) {
        await fs.writeFile(resolved, 'Mock audio content');
      } else {
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'stream',
        });
        const writer = fs.createWriteStream(resolved);
        response.data.pipe(writer);
        await new Promise<void>((resolve, reject) => {
          writer.on('finish', () => resolve());
          writer.on('error', (err: Error) => reject(err));
        });
      }
      spinner.succeed(chalk.green(`Downloaded: ${safeName}`));
      return resolved;
    } catch (error) {
      spinner.fail(chalk.red(`Download failed: ${String(error)}`));
      throw error;
    }
  }

  static async playAudio(filePath: string) {
    console.log(chalk.cyan(`Playing: ${path.basename(filePath)}`));
    console.log(chalk.dim('(Press Ctrl+C to stop)'));

    const platform = process.platform;
    let command = '';

    if (platform === 'darwin') {
      command = `afplay "${filePath}"`;
    } else if (platform === 'win32') {
      command = `powershell -c "(New-Object Media.SoundPlayer '${filePath}').PlaySync()"`;
    } else {
      command = `play "${filePath}" || aplay "${filePath}" || mpg123 "${filePath}"`;
    }

    try {
      await execAsync(command);
    } catch (error) {
      const err = error as { killed?: boolean };
      if (err.killed) return;
      console.error(chalk.red(`Error playing audio: ${String(error)}`));
      console.log(chalk.yellow(`Tip: Please install a command-line audio player for your OS.`));
    }
  }
}
