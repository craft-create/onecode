export const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) {
    return '-';
  }

  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) {
    return '-';
  }

  if (value === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const index = Math.min(Math.floor(Math.log(value) / Math.log(base)), units.length - 1);
  const formatted = (value / Math.pow(base, index)).toFixed(2);

  return `${parseFloat(formatted)} ${units[index]}`;
};
