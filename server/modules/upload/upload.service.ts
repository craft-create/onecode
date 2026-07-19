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
  private ffprobePath: string = process.env.FFPROBE_PATH || 'ffprobe';

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {
    this.ensureBaseDir();
    this.ensureFfmpegAvailable();
    this.ensureFfprobeAvailable();
  }

  private ensureFfmpegAvailable(): void {
    const detectedPath: string | undefined = this.detectBinaryPath(
      'ffmpeg',
      this.ffmpegPath,
      process.env.FFMPEG_PATH,
    );
    if (detectedPath) {
      this.ffmpegPath = detectedPath;
      this.logger.log(`FFmpeg found at: ${this.ffmpegPath}`);
      return;
    }
    this.logger.warn('FFmpeg not found in PATH. Video thumbnail generation will not work.');
  }

  private ensureFfprobeAvailable(): void {
    const detectedPath: string | undefined = this.detectBinaryPath(
      'ffprobe',
      this.ffprobePath,
      process.env.FFPROBE_PATH,
    );
    if (detectedPath) {
      this.ffprobePath = detectedPath;
      this.logger.log(`FFprobe found at: ${this.ffprobePath}`);
      return;
    }
    this.logger.warn('FFprobe not found in PATH. Video metadata extraction may not work.');
  }

  private detectBinaryPath(
    binaryName: string,
    fallback: string,
    envPath?: string,
  ): string | undefined {
    const candidatePaths: string[] = [];

    if (envPath) {
      candidatePaths.push(envPath);
      if (existsSync(envPath)) {
        return envPath;
      }
    }

    try {
      const whichPath = execSync(`which ${binaryName}`, { stdio: 'pipe' })
        .toString()
        .trim();
      if (whichPath) {
        return whichPath;
      }
    } catch (_error) {
      // continue to common paths
    }

    if (fallback && fallback !== binaryName && existsSync(fallback)) {
      return fallback;
    }

    const homeDir = process.env.HOME || '';
    candidatePaths.push(
      path.join(homeDir, 'bin', binaryName),
      '/usr/local/bin/' + binaryName,
      '/opt/homebrew/bin/' + binaryName,
    );

    for (const binaryPath of candidatePaths) {
      if (existsSync(binaryPath)) {
        return binaryPath;
      }
    }

    return undefined;
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
    duration?: number;
    resolution?: string;
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
    const isVideo: boolean = file.mimetype.startsWith('video/');
    const videoMetadata = isVideo ? await this.extractVideoMetadata(filePath) : {};
    const thumbnailUrl = isVideo
      ? await this.generateVideoThumbnail(filePath, dateDir)
      : undefined;
    const duration: number | undefined = videoMetadata.duration;
    const resolution: string | undefined = videoMetadata.resolution;

    return {
      url,
      thumbnailUrl,
      duration,
      resolution,
      filename: uniqueName,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private async extractVideoMetadata(
    videoPath: string,
  ): Promise<{ duration?: number; resolution?: string }> {
    try {
      const { stdout } = await execFileAsync(this.ffprobePath, [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        videoPath,
      ]);
      const parsedOutput = JSON.parse(stdout) as {
        format?: {
          duration?: string;
        };
        streams?: Array<{
          codec_type?: string;
          width?: number;
          height?: number;
          duration?: string;
        }>;
      };
      const videoStream = (parsedOutput.streams || []).find(
        (stream): boolean => stream.codec_type === 'video',
      );
      const width: number = Number(videoStream?.width);
      const height: number = Number(videoStream?.height);
      const resolution: string | undefined =
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0
          ? `${width}x${height}`
          : undefined;

      const rawDuration = Number(parsedOutput.format?.duration || videoStream?.duration);
      const duration = Number.isFinite(rawDuration) ? Math.round(rawDuration) : undefined;

      if (duration === undefined && resolution === undefined) {
        return {};
      }

      return { duration, resolution };
    } catch (_error) {
      this.logger.warn(`Failed to extract video metadata: ${videoPath}`);
      return {};
    }
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
