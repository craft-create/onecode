import path from 'path';

/**
 * 解析上传文件的持久化根目录。
 * 1）优先使用 UPLOAD_BASE_DIR 环境变量。
 * 2）默认使用仓库根目录下的 data/uploads，避免 dist/build 重建被清理。
 * 3）兼容生产端若在 dist 目录运行时，自动回退到上级目录作为仓库根。
 */
export function resolveUploadBaseDir(): string {
  const explicit = process.env.UPLOAD_BASE_DIR?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }

  const cwd = process.cwd();
  const repoRoot = path.basename(cwd) === 'dist' ? path.resolve(cwd, '..') : cwd;
  return path.resolve(repoRoot, 'data', 'uploads');
}
