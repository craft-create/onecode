import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/compat/client-toolkit/logger';
import { toggleMaterialLike } from '@client/src/api/materials';
import { toggleScriptLike } from '@client/src/api/scripts';
import { useAuth } from '@client/src/hooks/useAuth';

interface LikeButtonProps {
  targetId: string;
  targetType: 'material' | 'script';
  initialLiked?: boolean;
  initialCount?: number;
  onStatusChange?: (liked: boolean, count: number) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  targetId,
  targetType,
  initialLiked = false,
  initialCount = 0,
  onStatusChange,
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
    onStatusChange?.(initialLiked, initialCount);
  }, [initialLiked, initialCount, onStatusChange]);

  const handleToggle = useCallback(async () => {
    if (!targetId) return;
    setAnimating(true);
    const wasLiked = liked;
    const currentCount = count;
    const optimisticCount = wasLiked
      ? Math.max(0, currentCount - 1)
      : currentCount + 1;
    // Optimistic update
    setLiked(!wasLiked);
    setCount(optimisticCount);
    onStatusChange?.(!wasLiked, optimisticCount);
    try {
      const res =
        targetType === 'material'
          ? await toggleMaterialLike(targetId)
          : await toggleScriptLike(targetId);
      setLiked(res.liked);
      setCount(res.like_count);
      onStatusChange?.(res.liked, res.like_count);
    } catch (err: unknown) {
      // Revert on error
      setLiked(wasLiked);
      const fallbackCount = currentCount;
      setCount(fallbackCount);
      const fallbackLiked = wasLiked;
      onStatusChange?.(fallbackLiked, fallbackCount);
      logger.error('点赞操作失败:', err);
      toast.error('操作失败，请重试');
    } finally {
      setAnimating(false);
    }
  }, [targetId, targetType, liked, count, onStatusChange]);

  // 未登录时不渲染按钮
  if (!user) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
        liked
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30'
      }`}
    >
      <motion.span
        animate={
          animating
            ? { scale: [1, 1.3, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Heart
          className="w-4 h-4"
          fill={liked ? 'currentColor' : 'none'}
        />
      </motion.span>
      {count > 0 && (
        <span className="tabular-nums">{count}</span>
      )}
    </motion.button>
  );
};

export default LikeButton;
