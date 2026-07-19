import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  History,
  Download,
  List,
  X,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/compat/client-toolkit/logger';
import { toast } from 'sonner';
import { useAuth } from '@client/src/hooks/useAuth';
import {
  getLatestContent,
  getContentByVersion,
  saveContent,
  getOutline,
  getVersions,
  revertVersion,
  getScriptLikeStatus,
} from '@/api/scripts';
import LikeButton from '@client/src/components/LikeButton';
import FavoriteButton from '@client/src/components/FavoriteButton';
import CommentSection from '@client/src/components/CommentSection';
import type {
  ScriptContentLatest,
  ScriptOutlineItem,
  ScriptVersionItem,
} from '@shared/script.interface';

const ScriptEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState('');
  const [version, setVersion] = useState('v1');
  const [cnCharCount, setCnCharCount] = useState(0);
  const [enWordCount, setEnWordCount] = useState(0);
  const [sceneCount, setSceneCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    'saved',
  );

  const [outlineOpen, setOutlineOpen] = useState(false);
  const [outline, setOutline] = useState<ScriptOutlineItem[]>([]);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<ScriptVersionItem[]>([]);
  const [previewVersion, setPreviewVersion] = useState<ScriptVersionItem | null>(
    null,
  );
  const [previewContent, setPreviewContent] = useState('');
  const [reverting, setReverting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const computeStats = useCallback((text: string) => {
    // Chinese character count (exclude spaces, punctuation, English letters)
    const cnChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    // English word count
    const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
    // Scene count
    const sc = (text.match(/^\d+\.\s+.+$/gm) || []).length;
    // Duration estimate: CN ~300 chars/min, EN ~150 words/min
    const cnMinutes = cnChars / 300;
    const enMinutes = enWords / 150;
    const totalMinutes = Math.max(1, Math.ceil(cnMinutes + enMinutes));

    setCnCharCount(cnChars);
    setEnWordCount(enWords);
    setSceneCount(sc);
    setEstimatedMinutes(totalMinutes);
  }, []);

  const doSave = useCallback(
    async (text: string) => {
      if (!id) return;
      setSaveStatus('saving');
      try {
        const res = await saveContent(id, {
          content: text,
          snapshot_summary: undefined,
        });
        setVersion(res.version);
        setSaveStatus('saved');
        logger.info(`Auto-saved project ${id} at ${res.version}`);
      } catch (err: unknown) {
        logger.error('Auto-save failed:', String(err));
        setSaveStatus('unsaved');
        toast.error('自动保存失败，请手动保存');
      }
    },
    [id],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    computeStats(newContent);
    setSaveStatus('unsaved');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave(newContent);
    }, 3000);
  };

  const handleManualSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await saveContent(id, {
        content,
        snapshot_summary: undefined,
      });
      setVersion(res.version);
      setSaveStatus('saved');
    } catch (err: unknown) {
      logger.error('Save failed:', String(err));
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const fetchContent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const data: ScriptContentLatest = await getLatestContent(id);
      setContent(data.content);
      setVersion(data.version);
      computeStats(data.content);
    } catch (err: unknown) {
      logger.error('Failed to load content:', String(err));
      setLoadError('加载项目内容失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, [id, computeStats]);

  const fetchOutline = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOutline(id);
      setOutline(data.items);
    } catch (err: unknown) {
      logger.error('Failed to load outline:', String(err));
    }
  }, [id]);

  const fetchVersions = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getVersions(id, { pageSize: 50 });
      setVersions(data.items);
    } catch (err: unknown) {
      logger.error('Failed to load versions:', String(err));
    }
  }, [id]);

  useEffect(() => {
    fetchContent();
    fetchOutline();
    if (id) {
      getScriptLikeStatus(id)
        .then((status) => {
          setIsLiked(status.liked);
          setLikeCount(status.like_count);
        })
        .catch(() => {});
    }
  }, [fetchContent, fetchOutline, id]);

  // 清理未完成的自动保存计时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Warn before leaving with unsaved content
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  useEffect(() => {
    if (historyOpen) fetchVersions();
  }, [historyOpen, fetchVersions]);

  const scrollToPosition = (pos: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos);
      const textBefore = content.substring(0, pos);
      const lineNum = textBefore.split('\n').length;
      const lineHeight = 24;
      textareaRef.current.scrollTop = Math.max(0, (lineNum - 5) * lineHeight);
    }
  };

  const handlePreviewVersion = async (v: ScriptVersionItem) => {
    setPreviewVersion(v);
    try {
      const data = await getContentByVersion(id!, v.id);
      setPreviewContent(data.content);
    } catch {
      setPreviewContent('(无法加载预览)');
    }
  };

  const handleRevert = async () => {
    if (!id || !previewVersion) return;
    setReverting(true);
    try {
      const res = await revertVersion(id, { version_id: previewVersion.id });
      setVersion(res.new_version);
      setHistoryOpen(false);
      setPreviewVersion(null);
      await fetchContent();
    } catch (err: unknown) {
      logger.error('Revert failed:', String(err));
    } finally {
      setReverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleManualSave();
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-[hsl(228_15%_8%)] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-[hsl(220_15%_90%)] text-lg font-medium">
            项目不存在
          </p>
          <p className="text-[hsl(220_10%_55%)] text-sm mt-1">
            请从剧本列表选择有效项目
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(228_15%_8%)] flex items-center justify-center">
        <div className="text-[hsl(220_10%_55%)]">加载中...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[hsl(228_15%_8%)] flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center max-w-md mx-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-[hsl(220_15%_90%)] text-sm mb-4">{loadError}</p>
          <button
            onClick={fetchContent}
            className="app-btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(228_15%_8%)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/scripts')}
            className="text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]"
          >
            ← 返回
          </Button>
          <span className="text-sm text-[hsl(220_10%_55%)]">{version}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              saveStatus === 'saved'
                ? 'bg-[hsl(152_65%_45%)]/20 text-[hsl(152_65%_45%)]'
                : saveStatus === 'saving'
                  ? 'bg-[hsl(38_90%_55%)]/20 text-[hsl(38_90%_55%)]'
                  : 'bg-[hsl(0_72%_55%)]/20 text-[hsl(0_72%_55%)]'
            }`}
          >
            {saveStatus === 'saved'
              ? '已保存'
              : saveStatus === 'saving'
                ? '保存中...'
                : '未保存'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOutlineOpen(!outlineOpen)}
            className={`gap-1.5 border-[hsl(228_12%_18%)] ${
              outlineOpen
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-[hsl(220_10%_55%)]'
            }`}
          >
            <List className="size-3.5" />
            大纲
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="gap-1.5 border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)]"
          >
            <History className="size-3.5" />
            版本
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommentsOpen(!commentsOpen)}
            className={`gap-1.5 border-[hsl(228_12%_18%)] ${
              commentsOpen
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-[hsl(220_10%_55%)]'
            }`}
          >
            <MessageSquare className="size-3.5" />
            评论
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/scripts/${id}/export`)}
            className="gap-1.5 border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)]"
          >
            <Download className="size-3.5" />
            导出
          </Button>
          <div className="flex items-center gap-1.5">
            <LikeButton
              targetId={id}
              targetType="script"
              initialLiked={isLiked}
              initialCount={likeCount}
            />
            <FavoriteButton targetId={id} targetType="script" />
          </div>
          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={saving}
            className="app-btn-primary-compact"
          >
            <Save className="size-3.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="开始编写剧本...&#10;&#10;1. INT. 办公室 - 白天&#10;&#10;角色名&#10;对话内容..."
            className="flex-1 w-full resize-none bg-[hsl(228_15%_8%)] text-[hsl(220_15%_90%)] p-8 font-['JetBrains_Mono','Courier_New',monospace] text-sm leading-6 outline-none placeholder:text-[hsl(220_10%_30%)]"
            spellCheck={false}
          />

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 border-t border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] text-xs text-[hsl(220_10%_55%)]">
            <div className="flex items-center gap-4">
              <span>字数: {cnCharCount.toLocaleString()}</span>
              <span>单词: {enWordCount.toLocaleString()}</span>
              <span>场景: {sceneCount}</span>
              <span className="text-[hsl(220_10%_40%)]">|</span>
              <span>预估时长: ~{estimatedMinutes}分钟</span>
            </div>
            <span>Ctrl+S 保存</span>
          </div>

          {/* Comments panel */}
          <AnimatePresence>
            {commentsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-[hsl(228_12%_18%)]"
              >
                <div className="max-h-80 overflow-y-auto p-4">
                  <CommentSection targetId={id} targetType="script" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Outline Panel */}
        <AnimatePresence>
          {outlineOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="border-l border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] overflow-hidden shrink-0"
            >
              <div className="w-[260px] h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(228_12%_18%)]">
                  <span className="text-sm font-medium text-[hsl(220_15%_90%)]">
                    场景大纲
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutlineOpen(false)}
                    className="size-7 p-0 text-[hsl(220_10%_55%)]"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {outline.length === 0 ? (
                    <p className="text-xs text-[hsl(220_10%_55%)] p-3 text-center">
                      暂无场景，以「数字.」开头定义场景
                    </p>
                  ) : (
                    outline.map((item) => (
                      <button
                        key={item.index}
                        type="button"
                        onClick={() => scrollToPosition(item.position)}
                        className="w-full text-left px-3 py-2 rounded-md text-xs text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)] transition-colors flex items-center gap-2"
                      >
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] px-1 py-0"
                        >
                          {item.index}
                        </Badge>
                        <span className="truncate">{item.scene_header}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Version History Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => {
                setHistoryOpen(false);
                setPreviewVersion(null);
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-[hsl(228_14%_12%)] border-l border-[hsl(228_12%_18%)] z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(228_12%_18%)]">
                <h3 className="font-semibold text-[hsl(220_15%_90%)]">
                  版本历史
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHistoryOpen(false);
                    setPreviewVersion(null);
                  }}
                  className="size-7 p-0 text-[hsl(220_10%_55%)]"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                      previewVersion?.id === v.id
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-[hsl(228_12%_18%)] hover:border-[hsl(220_10%_40%)]'
                    }`}
                    onClick={() => handlePreviewVersion(v)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {v.version}
                      </Badge>
                      <span className="text-[10px] text-[hsl(220_10%_55%)]">
                        {new Date(v.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(220_10%_55%)] truncate">
                      {v.snapshot_summary || '无描述'}
                    </p>
                    <p className="text-[10px] text-[hsl(220_10%_40%)] mt-0.5">
                      {v.author_name || '未知作者'}
                    </p>
                  </div>
                ))}
              </div>

              {previewVersion && (
                <div className="border-t border-[hsl(228_12%_18%)] p-4 space-y-3">
                  <div className="bg-[hsl(228_15%_8%)] rounded-md p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs text-[hsl(220_10%_55%)] font-mono whitespace-pre-wrap">
                      {previewContent || '(空内容)'}
                    </pre>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRevert}
                    disabled={reverting}
                    className="w-full app-btn-primary-compact"
                  >
                    <RotateCcw className="size-3.5" />
                    {reverting
                      ? '回退中...'
                      : `回退至 ${previewVersion.version}`}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScriptEditorPage;
