import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  UserPlus as _UserPlus,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { analyticsApi } from '@client/src/api';
import {
  getMaterialById,
  getMaterialLikeStatus,
  getRelatedMaterials,
  getMaterialDownloadUrl,
} from '@client/src/api/materials';
import { api as _api, chatApi } from '@client/src/api';
import { toggleFavorite } from '@client/src/api/user-materials';
import { useAuth } from '@client/src/hooks/useAuth';
import { Image } from '@client/src/components/ui/image';
import { Button as _Button } from '@client/src/components/ui/button';
import {
  Dialog as _Dialog,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
} from '@client/src/components/ui/dialog';
import { Textarea as _Textarea } from '@client/src/components/ui/textarea';
import { PageFrame } from '../shared/PageShell';
import { MaterialDetailSidePanel } from './components/MaterialDetailSidePanel';
import type {
  MaterialDetail,
  MaterialRelatedItem,
} from '@shared/material.interface';
import { toast } from 'sonner';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MaterialDetail | null>(null);
  const [related, setRelated] = useState<MaterialRelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [_requestChatOpen, _setRequestChatOpen] = useState(false);
  const [requestReason, _setRequestReason] = useState('');
  const [submittingRequest, _setSubmittingRequest] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const trackedMaterialRef = useRef<string | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);
  const [audioBarHeights, setAudioBarHeights] = useState<number[]>(
    Array.from({ length: 5 }, (_, i: number) => {
      const seed = Math.sin(i * 0.7) * 0.5 + 0.5;
      return 10 + seed * 30;
    }),
  );

  const { user } = useAuth();

  const refreshMaterialDetail = useCallback(async () => {
    if (!id) return;
    const detailData = await getMaterialById(id);
    setDetail(detailData);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getMaterialById(id),
      getRelatedMaterials(id, 1, 8),
      getMaterialLikeStatus(id).catch(() => ({
        liked: false,
        like_count: 0,
      })),
    ])
      .then((
        [detailData, relatedData, likeStatus],
      ) => {
        setDetail(detailData);
        setRelated(relatedData.items);
        setIsLiked(likeStatus.liked);
        setLikeCount(likeStatus.like_count);
      })
      .catch((err: unknown) => logger.error('获取素材详情失败:', err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !detail || trackedMaterialRef.current === id) {
      return;
    }

    trackedMaterialRef.current = id;
    analyticsApi.track({
      action: 'view',
      resourceType: 'material',
      resourceId: id,
    }).catch(() => {});
  }, [detail, id]);

  const handlePlayPause = useCallback(() => {
    const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;
    if (isPlaying) {
      media.pause();
    } else {
      media.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, detail?.type]);

  const handleMute = useCallback(() => {
    const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted, detail?.type]);

  const handleFullscreen = useCallback(() => {
    const container = document.getElementById('media-container');
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen?.();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;
    setCurrentTime(media.currentTime);
    if (detail?.type === 'audio') {
      setAudioProgress(media.duration > 0 ? (media.currentTime / media.duration) * 100 : 0);
    }
  }, [detail?.type]);

  const handleLoadedMetadata = useCallback(() => {
    const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;
    setDurationState(media.duration);
    if (detail?.type === 'audio') {
      setAudioDuration(media.duration);
    }
  }, [detail?.type]);

  const updateMediaTimeFromEvent = useCallback(
    (clientX: number, barElement: HTMLElement) => {
      const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
      if (!media) return;
      const rect = barElement.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      media.currentTime = ratio * media.duration;
    },
    [detail?.type],
  );

  const updateVolumeFromEvent = useCallback(
    (clientX: number, barElement: HTMLElement) => {
      const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
      if (!media) return;
      const rect = barElement.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      media.volume = ratio;
      setVolume(ratio);
      setIsMuted(ratio === 0);
    },
    [detail?.type],
  );

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateMediaTimeFromEvent(e.clientX, e.currentTarget);
  }, [updateMediaTimeFromEvent]);

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingProgress(true);
      updateMediaTimeFromEvent(e.clientX, e.currentTarget);
    },
    [updateMediaTimeFromEvent],
  );

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingVolume(true);
      updateVolumeFromEvent(e.clientX, e.currentTarget);
    },
    [updateVolumeFromEvent],
  );

  // Global mousemove/mouseup for drag
  useEffect(() => {
    if (!isDraggingProgress && !isDraggingVolume) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress) {
        const bar = document.getElementById('progress-bar');
        if (bar) updateMediaTimeFromEvent(e.clientX, bar);
      }
      if (isDraggingVolume) {
        const bar = document.getElementById('volume-bar');
        if (bar) updateVolumeFromEvent(e.clientX, bar);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume, updateMediaTimeFromEvent, updateVolumeFromEvent]);

  const handleSpeedChange = useCallback((rate: number) => {
    const media = detail?.type === 'audio' ? audioRef.current : videoRef.current;
    if (!media) return;
    media.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, [detail?.type]);

  const isAudio = detail?.type === 'audio';
  const isVideo = detail?.type === 'video';

  // Audio waveform animation
  useEffect(() => {
    if (!isAudio || !isPlaying) {
      if (audioAnimFrameRef.current) {
        cancelAnimationFrame(audioAnimFrameRef.current);
        audioAnimFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      setAudioBarHeights((prev: number[]) =>
        prev.map((_, i: number) => {
          const seed = Math.sin(i * 0.7) * 0.5 + 0.5;
          const wave = Math.sin((Date.now() / 200) + i * 0.8) * 25;
          return 10 + seed * 30 + wave;
        }),
      );
      audioAnimFrameRef.current = requestAnimationFrame(animate);
    };

    audioAnimFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (audioAnimFrameRef.current) {
        cancelAnimationFrame(audioAnimFrameRef.current);
        audioAnimFrameRef.current = null;
      }
    };
  }, [isAudio, isPlaying]);

  // Auto-hide controls after 3s of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!id || downloading) return;
    setDownloading(true);
    setDownloadDone(false);
    try {
      const { download_url } = await getMaterialDownloadUrl(id);
      // Simulate download progress
      await new Promise((r) => setTimeout(r, 1500));
      if (download_url) {
        window.open(download_url, '_blank');
      }
      await refreshMaterialDetail();
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch (err: unknown) {
      logger.error('下载失败:', err);
    } finally {
      setDownloading(false);
    }
  }, [id, downloading, refreshMaterialDetail]);

  const handleFavorite = useCallback(async () => {
    if (!id) return;
    try {
      await toggleFavorite({
        material_id: id,
        action: isFavorited ? 'remove' : 'add',
      });
      setIsFavorited(!isFavorited);
    } catch (err: unknown) {
      logger.error('收藏操作失败:', err);
    }
  }, [id, isFavorited]);

  const handleLikeChange = useCallback((liked: boolean, count: number): void => {
    setIsLiked(liked);
    setLikeCount(count);
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);

  const _isSelfMaterial = detail?.creator_id && user?.userId
    ? detail.creator_id === user.userId
    : false;

  const _canRequestChat = !!(
    detail?.creator_id &&
    user?.userId &&
    detail.creator_id !== user.userId
  );

  const _handleOpenRequestChat = useCallback(() => {
    if (!user?.userId) {
      toast.error('请先登录后再发起聊天申请');
      return;
    }
    if (!detail?.creator_id) {
      toast.error('未获取到作者信息，无法发送申请');
      return;
    }
    _setRequestReason('');
    _setRequestChatOpen(true);
  }, [detail?.creator_id, user?.userId]);

  const _handleCloseRequestChat = useCallback(() => {
    if (!submittingRequest) {
      _setRequestChatOpen(false);
    }
  }, [submittingRequest]);

  const _submitChatRequest = useCallback(async () => {
    if (!detail?.creator_id || !user?.userId || submittingRequest) {
      return;
    }
    _setSubmittingRequest(true);
    try {
      await chatApi.createChatRequest({
        toUserId: detail.creator_id,
        reason: requestReason.trim(),
      });
      toast.success('已发送聊天申请，等待对方通过');
      _setRequestChatOpen(false);
    } catch (_error) {
      toast.error('发送聊天申请失败');
    } finally {
      _setSubmittingRequest(false);
    }
  }, [detail?.creator_id, requestReason, submittingRequest, user?.userId]);

  if (loading) {
    return (
      <PageFrame
        className="min-h-screen bg-background"
        containerClassName="app-container-shell"
        contentClassName="flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </PageFrame>
    );
  }

  if (!detail) {
    return (
      <PageFrame
        className="min-h-screen bg-background"
        containerClassName="app-container-shell"
        contentClassName="flex flex-col items-center justify-center text-muted-foreground"
      >
        <p className="text-lg">素材不存在</p>
        <button
          onClick={() => navigate('/materials')}
          className="mt-4 text-primary hover:underline text-sm"
        >
          返回素材库
        </button>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      className="min-h-screen bg-background"
      containerClassName="app-container py-6"
      contentClassName="space-y-4"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border py-2">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/materials')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">返回</span>
          </motion.button>
          <h1 className="text-sm font-medium text-foreground truncate flex-1">
            {detail.title}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video / Audio Player */}
            {isVideo && (
              <motion.div
                id="media-container"
                className="relative rounded-lg overflow-hidden bg-black aspect-video group"
                onMouseMove={resetControlsTimer}
                onMouseLeave={() => isPlaying && setShowControls(false)}
              >
                {detail.preview_url ? (
                  <video
                    ref={videoRef}
                    src={detail.preview_url}
                    className="w-full h-full object-contain cursor-pointer"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onClick={handlePlayPause}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent">
                    <Play className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}

                {/* Center play button overlay */}
                {detail.preview_url && !isPlaying && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
                  >
                    <div className="size-16 rounded-full bg-primary/80 flex items-center justify-center shadow-[0_0_30px_-4px_rgba(124_92_255_0.5)]">
                      <Play className="size-7 text-white ml-1" />
                    </div>
                  </motion.button>
                )}

                {/* Custom Controls */}
                {detail.preview_url && (
                  <AnimatePresence>
                    {showControls && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
                      >
                        {/* Progress bar */}
                        <div
                          id="progress-bar"
                          className="h-1 bg-white/20 cursor-pointer group/progress mx-3 mt-2 rounded-full overflow-hidden"
                          onClick={handleSeek}
                          onMouseDown={handleProgressMouseDown}
                        >
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-100"
                            style={{
                              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-3 px-3 py-2">
                          {/* Play/Pause */}
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={handlePlayPause}
                            className="text-white hover:text-primary transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </motion.button>

                          {/* Time */}
                          <span className="text-xs text-white/70 tabular-nums min-w-[80px]">
                            {formatDuration(currentTime)} / {formatDuration(duration)}
                          </span>

                          {/* Volume */}
                          <div className="flex items-center gap-1.5 group/vol">
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={handleMute}
                              className="text-white hover:text-primary transition-colors"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </motion.button>
                            <div
                              id="volume-bar"
                              className="w-20 h-1 bg-white/20 rounded-full cursor-pointer hidden group-hover/vol:block"
                              onClick={(e: React.MouseEvent<HTMLDivElement>) => updateVolumeFromEvent(e.clientX, e.currentTarget)}
                              onMouseDown={handleVolumeMouseDown}
                            >
                              <div
                                className="h-full bg-white rounded-full"
                                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex-1" />

                          {/* Speed */}
                          <div className="relative">
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                              className="text-xs text-white/80 hover:text-white transition-colors px-1.5 py-0.5 rounded"
                            >
                              {playbackRate}x
                            </motion.button>
                            <AnimatePresence>
                              {showSpeedMenu && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute bottom-full right-0 mb-2 bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg py-1 shadow-xl min-w-[80px]"
                                >
                                  {SPEED_OPTIONS.map((rate: number) => (
                                    <button
                                      key={rate}
                                      onClick={() => handleSpeedChange(rate)}
                                      className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                        playbackRate === rate
                                          ? 'text-primary bg-primary/10'
                                          : 'text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)] hover:bg-[hsl(228_12%_18%)]'
                                      }`}
                                    >
                                      {rate}x
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Fullscreen */}
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={handleFullscreen}
                            className="text-white hover:text-primary transition-colors"
                          >
                            {isFullscreen ? (
                              <Minimize className="w-4 h-4" />
                            ) : (
                              <Maximize className="w-4 h-4" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {/* Audio Player */}
            {isAudio && (
              <div className="rounded-lg overflow-hidden bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] p-6">
                {detail.preview_url && (
                  <audio
                    ref={audioRef}
                    src={detail.preview_url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                )}

                {/* Waveform visualization */}
                <div className="flex items-end justify-center gap-1.5 h-20 mb-4">
                  {audioBarHeights.map((h: number, i: number) => (
                    <motion.div
                      key={i}
                      className="w-2 rounded-full bg-primary/60"
                      animate={{ height: h }}
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                      style={{
                        opacity: audioProgress > (i / audioBarHeights.length) * 100 ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* Audio progress bar */}
                <div
                  className="h-1.5 bg-[hsl(228_12%_18%)] rounded-full cursor-pointer mb-3"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>

                {/* Audio controls */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handlePlayPause}
                    className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4 ml-0.5" />
                    )}
                  </motion.button>
                  <span className="text-xs text-[hsl(220_10%_55%)] tabular-nums">
                    {formatDuration(currentTime)} / {formatDuration(audioDuration)}
                  </span>
                  <div className="flex-1" />
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleMute}
                    className="text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="size-4" />
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Fallback for non-media types */}
            {!isVideo && !isAudio && detail.preview_url && (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <Image
                  src={detail.preview_url}
                  alt={detail.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* No preview */}
            {!detail.preview_url && (
              <div className="rounded-lg overflow-hidden bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] aspect-video flex items-center justify-center">
                <Play className="w-16 h-16 text-[hsl(220_10%_30%)]" />
              </div>
            )}

            {/* Description */}
            {detail.description && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h2 className="text-sm font-medium text-foreground mb-2">
                  描述
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detail.description}
                </p>
              </div>
            )}

            {/* Related Materials */}
            {related.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-foreground mb-3">
                  相关素材
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                  {related.map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate(`/materials/${item.id}`)}
                      className="flex-shrink-0 w-40 text-left group"
                    >
                      <div className="aspect-video rounded-lg overflow-hidden bg-accent mb-2">
                        {item.cover_url ? (
                          <Image
                            src={item.cover_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      {item.duration > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          {formatDuration(item.duration)}
                        </p>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <MaterialDetailSidePanel
            detail={detail}
            isFavorited={isFavorited}
            downloading={downloading}
            downloadDone={downloadDone}
            onDownload={handleDownload}
            isLiked={isLiked}
            likeCount={likeCount}
            onLikeChange={handleLikeChange}
            onFavorite={handleFavorite}
            formatDuration={formatDuration}
            formatFileSize={formatFileSize}
          />
        </div>
    </PageFrame>
  );
};

export default MaterialDetailPage;
