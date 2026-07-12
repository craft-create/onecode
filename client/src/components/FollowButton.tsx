import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toggleFollow, getFollowStatus } from '@client/src/api/follow';
import { useAuth } from '@client/src/hooks/useAuth';

interface FollowButtonProps {
  userId: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await toggleFollow(userId);
      setIsFollowing(res.is_following);
      toast.success(res.is_following ? '已关注' : '已取消关注');
    } catch (err: unknown) {
      logger.error('关注操作失败:', err);
      toast.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 未登录时不渲染按钮
  if (!user) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isFollowing
          ? hovering
            ? 'bg-destructive/10 text-destructive border border-destructive/30'
            : 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary'
      }`}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : isFollowing ? (
        hovering ? (
          <UserCheck className="w-3.5 h-3.5" />
        ) : (
          <UserCheck className="w-3.5 h-3.5" />
        )
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      <span>
        {loading
          ? '处理中...'
          : isFollowing
            ? hovering
              ? '取消关注'
              : '已关注'
            : '关注'}
      </span>
    </motion.button>
  );
};

export default FollowButton;
