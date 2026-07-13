import { motion } from 'framer-motion';
import { AlertCircle, HardDrive } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FC } from 'react';
import { type StorageStats } from './types';

interface StorageSectionProps {
  storageStats: StorageStats | null;
  storageLoading: boolean;
}

export const StorageSection: FC<StorageSectionProps> = ({ storageStats, storageLoading }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>存储空间</CardTitle>
        <CardDescription>查看和管理你的存储空间使用情况</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {storageStats ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">已使用空间</span>
                <span className="font-medium">
                  {storageStats.formattedUsed} / {storageStats.formattedQuota}
                </span>
              </div>
              <div className="h-3 bg-accent rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${storageStats.usagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${
                    storageStats.usagePercent > 90
                      ? 'bg-destructive'
                      : storageStats.usagePercent > 70
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                  }`}
                />
              </div>
              <p className="text-xs text-muted-foreground">剩余 {storageStats.formattedRemaining}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">已使用</span>
                </div>
                <p className="text-2xl font-bold">{storageStats.formattedUsed}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">总配额</span>
                </div>
                <p className="text-2xl font-bold">{storageStats.formattedQuota}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">剩余</span>
                </div>
                <p className="text-2xl font-bold">{storageStats.formattedRemaining}</p>
              </div>
            </div>

            {storageStats.usagePercent > 90 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">存储空间不足</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    你的存储空间已使用超过 90%，建议清理不需要的文件或升级存储空间。
                  </p>
                </div>
              </div>
            )}

            {storageStats.usagePercent > 70 && storageStats.usagePercent <= 90 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-600">存储空间提醒</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    你的存储空间已使用超过 70%，请注意空间使用情况。
                  </p>
                </div>
              </div>
            )}
          </>
        ) : null}

        {storageLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {!storageLoading && !storageStats && (
          <div className="text-sm text-muted-foreground text-center py-8">
            暂无可用存储统计数据，请刷新后重试
          </div>
        )}
      </CardContent>
    </Card>
  );
};
