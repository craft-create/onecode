import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { existsSync } from 'fs';
import { execFile, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { resolveUploadBaseDir } from '@server/common/utils/upload-path';

const execFileAsync = promisify(execFile);

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadBaseDir: string = resolveUploadBaseDir();
  private ffmpegPath: string = process.env.FFMPEG_PATH || 'ffmpeg';

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {
    this.ensureBaseDir();
    this.ensureFfmpegAvailable();
  }

  private ensureFfmpegAvailable(): void {
    // Check if ffmpeg is available in PATH or use absolute path
    try {
      const ffmpegWhich = execSync('which ffmpeg', { stdio: 'pipe' }).toString().trim();
      if (ffmpegWhich) {
        this.ffmpegPath = ffmpegWhich;
        this.logger.log(`FFmpeg found at: ${this.ffmpegPath}`);
      } else {
        this.tryCommonFfmpegPaths();
      }
    } catch (_error) {
      // ffmpeg not in PATH, try common locations
      this.tryCommonFfmpegPaths();
    }
  }

  private tryCommonFfmpegPaths(): void {
    const commonPaths = [
      path.join(process.env.HOME || '', 'bin', 'ffmpeg'),
      '/usr/local/bin/ffmpeg',
      '/opt/homebrew/bin/ffmpeg',
    ];
    for (const ffmpegPath of commonPaths) {
      try {
        if (existsSync(ffmpegPath)) {
          this.ffmpegPath = ffmpegPath;
          this.logger.log(`FFmpeg found at: ${this.ffmpegPath}`);
          return;
        }
      } catch (_error) {
        // Continue to next path
      }
    }
    this.logger.warn('FFmpeg not found in PATH. Video thumbnail generation will not work.');
  }

  private ensureBaseDir(): void {
    if (!fs.existsSync(this.uploadBaseDir)) {
      fs.mkdirSync(this.uploadBaseDir, { recursive: true });
      this.logger.log(`Created upload base directory: ${this.uploadBaseDir}`);
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{
    url: string;
    thumbnailUrl?: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    const dateDir: string = this.getDateDir();
    const targetDir: string = path.join(this.uploadBaseDir, dateDir);

    fs.mkdirSync(targetDir, { recursive: true });

    const uniqueName: string = `${uuidv4()}-${file.originalname}`;
    const filePath: string = path.join(targetDir, uniqueName);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`File saved: ${filePath}`);

    const url: string = `/uploads/${dateDir}/${uniqueName}`;
    const thumbnailUrl = file.mimetype.startsWith('video/')
      ? await this.generateVideoThumbnail(filePath, dateDir)
      : undefined;

    return {
      url,
      thumbnailUrl,
      filename: uniqueName,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private async generateVideoThumbnail(
    videoPath: string,
    dateDir: string,
  ): Promise<string | undefined> {
    const thumbnailDir = path.join(this.uploadBaseDir, dateDir, 'thumbnails');
    fs.mkdirSync(thumbnailDir, { recursive: true });

    const thumbnailName = `${uuidv4()}.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailName);

    const runFfmpeg = async (timestamp: string): Promise<void> => {
      await execFileAsync(this.ffmpegPath, [
        '-y',
        '-ss',
        timestamp,
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-vf',
        'scale=640:-1',
        '-q:v',
        '3',
        thumbnailPath,
      ]);
    };

    try {
      await runFfmpeg('1');
    } catch (_error) {
      this.logger.warn(`Failed to capture thumbnail at 1s, retrying at 0.1s: ${videoPath}`);
      try {
        await runFfmpeg('0.1');
      } catch (retryError) {
        this.logger.error('Failed to generate video thumbnail', retryError);
        return undefined;
      }
    }

    if (!fs.existsSync(thumbnailPath)) return undefined;
    return `/uploads/${dateDir}/thumbnails/${thumbnailName}`;
  }

  async deleteFile(url: string): Promise<boolean> {
    try {
      const relativePath: string = url.replace(/^\/uploads\//, '');
      const filePath: string = path.join(this.uploadBaseDir, relativePath);

    if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found for deletion: ${filePath}`);
        return false;
      }

      fs.unlinkSync(filePath);
      this.logger.log(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete file', error);
      return false;
    }
  }

  private getDateDir(): string {
    const now: Date = new Date();
    const year: string = now.getFullYear().toString();
    const month: string = (now.getMonth() + 1).toString().padStart(2, '0');
    const day: string = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
