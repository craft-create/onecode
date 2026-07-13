import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Heart, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/compat/client-toolkit/logger';
import { useCurrentUserProfile } from '@/compat/client-toolkit/hooks/useCurrentUserProfile';
import { UserDisplay } from '@/components/business-ui/user-display';
import { useAuth } from '@client/src/hooks/useAuth';
import {
  getMaterialComments,
  createMaterialComment,
  deleteMaterialComment,
  toggleCommentLike,
} from '@client/src/api/comments';
import { getComments, createComment } from '@client/src/api/scripts';
import type {
  MaterialCommentItem,
  MaterialCommentListResponse,
} from '@shared/material.interface';
import type { ScriptCommentItem, ScriptCommentListResponse } from '@shared/script.interface';

interface CommentSectionProps {
  targetId: string;
  targetType: 'material' | 'script';
}

type UnifiedComment = {
  id: string;
  parentId: string | null;
  content: string;
  author: string;
  authorName: string;
  likeCount: number;
  isLiked: boolean;
  replies: UnifiedComment[];
  createdAt: string;
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString('zh-CN');
};

const CommentSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i: number) => (
      <div key={i} className="flex gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-[hsl(228_12%_18%)]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 bg-[hsl(228_12%_18%)] rounded" />
          <div className="h-3 w-full bg-[hsl(228_12%_18%)] rounded" />
          <div className="h-3 w-3/4 bg-[hsl(228_12%_18%)] rounded" />
        </div>
      </div>
    ))}
  </div>
);

const CommentSection: React.FC<CommentSectionProps> = ({ targetId, targetType }) => {
  const userInfo = useCurrentUserProfile();
  const currentUserId: string = userInfo?.user_id ?? '';
  const { user } = useAuth();

  const [comments, setComments] = useState<UnifiedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      if (targetType === 'material') {
        const res: MaterialCommentListResponse = await getMaterialComments(targetId);
        const unified: UnifiedComment[] = (res.items ?? []).map(
          (item: MaterialCommentItem): UnifiedComment => ({
            id: item.id,
            parentId: item.parent_id,
            content: item.content,
            author: item.author,
            authorName: item.author_name ?? item.author,
            likeCount: item.like_count,
            isLiked: item.is_liked,
            replies: (item.replies ?? []).map(
              (reply: MaterialCommentItem): UnifiedComment => ({
                id: reply.id,
                parentId: reply.parent_id,
                content: reply.content,
                author: reply.author,
                authorName: reply.author_name ?? reply.author,
                likeCount: reply.like_count,
                isLiked: reply.is_liked,
                replies: [],
                createdAt: reply.created_at,
              }),
            ),
            createdAt: item.created_at,
          }),
        );
        setComments(unified);
      } else {
        const res: ScriptCommentListResponse = await getComments(targetId);
        const unified: UnifiedComment[] = (res.items ?? []).map(
          (item: ScriptCommentItem): UnifiedComment => ({
            id: item.id,
            parentId: null,
            content: item.comment,
            author: item.author_name,
            authorName: item.author_name,
            likeCount: 0,
            isLiked: false,
            replies: [],
            createdAt: item.created_at,
          }),
        );
        setComments(unified);
      }
    } catch (err: unknown) {
      logger.error('获取评论失败:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = useCallback(async () => {
    const content = newComment.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      if (targetType === 'material') {
        await createMaterialComment(targetId, { content });
      } else {
        await createComment(targetId, { position: 0, comment: content });
      }
      setNewComment('');
      toast.success('评论已发表');
      await fetchComments();
    } catch (err: unknown) {
      logger.error('发表评论失败:', err);
      toast.error('发表评论失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [newComment, submitting, targetId, targetType, fetchComments]);

  const handleReply = useCallback(
    async (parentId: string) => {
      const content = replyContent.trim();
      if (!content || replySubmitting) return;
      setReplySubmitting(true);
      try {
        if (targetType === 'material') {
          await createMaterialComment(targetId, { content, parent_id: parentId });
        } else {
          await createComment(targetId, { position: 0, comment: content });
        }
        setReplyTo(null);
        setReplyContent('');
        toast.success('回复已发表');
        await fetchComments();
      } catch (err: unknown) {
        logger.error('回复评论失败:', err);
        toast.error('回复失败，请重试');
      } finally {
        setReplySubmitting(false);
      }
    },
    [replyContent, replySubmitting, targetId, targetType, fetchComments],
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (targetType !== 'material') return;
      try {
        await deleteMaterialComment(targetId, commentId);
        toast.success('评论已删除');
        await fetchComments();
      } catch (err: unknown) {
        logger.error('删除评论失败:', err);
        toast.error('删除失败，请重试');
      }
    },
    [targetId, targetType, fetchComments],
  );

  const handleLike = useCallback(
    async (commentId: string) => {
      if (targetType !== 'material') return;
      try {
        const res = await toggleCommentLike(commentId);
        setComments((prev: UnifiedComment[]) =>
          prev.map((c: UnifiedComment): UnifiedComment => {
            if (c.id === commentId) {
              return {
                ...c,
                isLiked: res.liked,
                likeCount: res.liked ? c.likeCount + 1 : Math.max(0, c.likeCount - 1),
              };
            }
            if (c.replies.length > 0) {
              return {
                ...c,
                replies: c.replies.map((r: UnifiedComment): UnifiedComment =>
                  r.id === commentId
                    ? {
                        ...r,
                        isLiked: res.liked,
                        likeCount: res.liked ? r.likeCount + 1 : Math.max(0, r.likeCount - 1),
                      }
                    : r,
                ),
              };
            }
            return c;
          }),
        );
      } catch (err: unknown) {
        logger.error('点赞评论失败:', err);
      }
    },
    [targetType],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (replyTo) {
        handleReply(replyTo);
      } else {
        handleSubmit();
      }
    }
  };

  const topLevelComments = comments.filter(
    (c: UnifiedComment) => !c.parentId,
  );

  const renderComment = (comment: UnifiedComment, isReply: boolean = false) => {
    const isOwn = currentUserId && comment.author === currentUserId;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isReply ? 'ml-10 pl-4 border-l-2 border-[hsl(228_12%_18%)]' : ''}`}
      >
        <div className="flex gap-3 py-3">
          <UserDisplay
            value={[comment.author]}
            size="small"
            showLabel={false}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[hsl(220_15%_90%)]">
                {comment.authorName || comment.author}
              </span>
              <span className="text-xs text-[hsl(220_10%_55%)]">
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-[hsl(220_15%_90%)] leading-relaxed break-words">
              {comment.content}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {targetType === 'material' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleLike(comment.id)}
                    className={`inline-flex items-center gap-1 text-xs transition-colors ${
                      comment.isLiked
                        ? 'text-primary'
                        : 'text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]'
                    }`}
                  >
                    <Heart
                      className="w-3.5 h-3.5"
                      fill={comment.isLiked ? 'currentColor' : 'none'}
                    />
                    {comment.likeCount > 0 && (
                      <span className="tabular-nums">{comment.likeCount}</span>
                    )}
                  </button>
                  {!isReply && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(comment.id);
                        setReplyContent('');
                        setTimeout(() => replyTextareaRef.current?.focus(), 100);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      回复
                    </button>
                  )}
                </>
              )}
              {isOwn && targetType === 'material' && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="inline-flex items-center gap-1 text-xs text-[hsl(220_10%_55%)] hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              )}
            </div>

            {/* Reply input */}
            <AnimatePresence>
              {replyTo === comment.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex gap-2">
                    <textarea
                      ref={replyTextareaRef}
                      value={replyContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setReplyContent(e.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      placeholder={`回复 ${comment.authorName || comment.author}...`}
                      rows={2}
                      className="flex-1 resize-none rounded-lg bg-[hsl(228_15%_8%)] border border-[hsl(228_12%_18%)] text-sm text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)] px-3 py-2 outline-none focus:border-primary/50 transition-colors"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleReply(comment.id)}
                        disabled={replySubmitting || !replyContent.trim()}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {replySubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent('');
                        }}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)] transition-colors text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nested replies */}
        {comment.replies.length > 0 && (
          <div className="space-y-0">
            {comment.replies.map((reply: UnifiedComment) => renderComment(reply, true))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg p-4">
      <h2 className="text-sm font-medium text-[hsl(220_15%_90%)] mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[hsl(220_10%_55%)]" />
        评论
        {!loading && topLevelComments.length > 0 && (
          <span className="text-xs text-[hsl(220_10%_55%)] font-normal">
            ({topLevelComments.length})
          </span>
        )}
      </h2>

      {/* Comment input */}
      {user ? (
        <div className="flex gap-2 mb-6">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNewComment(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="写下你的评论... (Ctrl+Enter 发送)"
            rows={2}
            className="flex-1 resize-none rounded-lg bg-[hsl(228_15%_8%)] border border-[hsl(228_12%_18%)] text-sm text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)] px-3 py-2 outline-none focus:border-primary/50 transition-colors"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="shrink-0 self-end px-4 h-10 flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            发送
          </button>
        </div>
      ) : (
        <div className="mb-6 py-4 text-center rounded-lg bg-[hsl(228_15%_8%)] border border-[hsl(228_12%_18%)]">
          <p className="text-sm text-[hsl(220_10%_55%)]">
            <Link to="/login" className="text-primary hover:underline">登录</Link>
            {' '}后参与评论
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <CommentSkeleton />
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-[hsl(220_10%_30%)] mx-auto mb-3" />
          <p className="text-sm text-[hsl(220_10%_55%)]">
            暂无评论，来说点什么吧
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[hsl(228_12%_18%)]">
          {topLevelComments.map((comment: UnifiedComment) =>
            renderComment(comment),
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
