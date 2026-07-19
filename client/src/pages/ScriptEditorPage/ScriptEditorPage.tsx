import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@/compat/client-toolkit/logger';
import { toast } from 'sonner';
import { useAuth } from '@client/src/hooks/useAuth';
import { analyticsApi } from '@client/src/api';
import {
  getLatestContent,
  getContentByVersion,
  saveContent,
  getOutline,
  getVersions,
  revertVersion,
  getScriptLikeStatus,
  getScriptCollaborationConfig,
  syncScriptFromCollaboration,
} from '@/api/scripts';
import ScriptEditorToolbar from './components/ScriptEditorToolbar';
import ScriptEditorOutlinePanel from './components/ScriptEditorOutlinePanel';
import ScriptEditorVersionHistoryDrawer from './components/ScriptEditorVersionHistoryDrawer';
import ScriptEditorCommentsPanel from './components/ScriptEditorCommentsPanel';
import ScriptEditorStatusBar from './components/ScriptEditorStatusBar';
import type {
  ScriptContentLatest,
  ScriptOutlineItem,
  ScriptVersionItem,
  ScriptCollaborationConfig,
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
  const [collaborationConfig, setCollaborationConfig] =
    useState<ScriptCollaborationConfig | null>(null);
  const [collabSyncing, setCollabSyncing] = useState(false);
  const trackedScriptRef = useRef<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCollaborationMode = Boolean(
    collaborationConfig?.enabled && collaborationConfig.mode === 'etherpad',
  );
  const isCollaborationEditable = isCollaborationMode && Boolean(collaborationConfig?.can_edit);

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
      if (!id || isCollaborationMode) return;
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
    [id, isCollaborationMode],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isCollaborationMode) return;
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
    if (!id || (isCollaborationMode && !isCollaborationEditable)) return;
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

  const fetchCollaboration = useCallback(async () => {
    if (!id) return;
    try {
      const config = await getScriptCollaborationConfig(id);
      setCollaborationConfig(config);
    } catch (err: unknown) {
      logger.error('Failed to load collaboration config:', String(err));
      setCollaborationConfig({
        enabled: false,
        mode: 'local',
        pad_id: '',
        pad_url: '',
        can_edit: false,
      });
    }
  }, [id]);

  useEffect(() => {
    fetchContent();
    fetchOutline();
    fetchCollaboration();
    if (id) {
      getScriptLikeStatus(id)
        .then((status) => {
          setIsLiked(status.liked);
          setLikeCount(status.like_count);
        })
        .catch(() => {});
    }
  }, [fetchContent, fetchOutline, fetchCollaboration, id]);

  useEffect(() => {
    if (!id || trackedScriptRef.current === id) {
      return;
    }

    trackedScriptRef.current = id;
    analyticsApi.track({
      action: 'view',
      resourceType: 'script',
      resourceId: id,
    }).catch(() => {});
  }, [id]);

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
      if (saveStatus === 'unsaved' && !isCollaborationMode) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus, isCollaborationMode]);

  useEffect(() => {
    if (historyOpen) fetchVersions();
  }, [historyOpen, fetchVersions]);

  const scrollToPosition = (pos: number) => {
    if (isCollaborationMode || !textareaRef.current) return;
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

  const handleSyncCollaboration = async () => {
    if (!id || !isCollaborationEditable) return;
    setCollabSyncing(true);
    try {
      const res = await syncScriptFromCollaboration(id);
      if (res.changed) {
        await fetchContent();
        toast.success(`已同步最新协作内容，版本：${res.version || ''}`);
      } else {
        toast.success('协作内容与当前版本一致');
      }
      setSaveStatus('saved');
    } catch (err: unknown) {
      logger.error('Sync failed:', String(err));
      toast.error('同步失败，请重试');
    } finally {
      setCollabSyncing(false);
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
      <ScriptEditorToolbar
        id={id}
        version={version}
        saveStatus={saveStatus}
        isCollaborationMode={isCollaborationMode}
        isCollaborationEditable={isCollaborationEditable}
        outlineOpen={outlineOpen}
        commentsOpen={commentsOpen}
        collabSyncing={collabSyncing}
        isLiked={isLiked}
        likeCount={likeCount}
        saving={saving}
        onBack={() => navigate('/scripts')}
        onToggleOutline={() => setOutlineOpen((prev) => !prev)}
        onOpenHistory={() => setHistoryOpen(true)}
        onToggleComments={() => setCommentsOpen((prev) => !prev)}
        onSyncCollaboration={handleSyncCollaboration}
        onManualSave={handleManualSave}
        onExport={() => navigate(`/scripts/${id}/export`)}
      />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
          <div className="flex-1 flex flex-col min-w-0">
          {isCollaborationMode ? (
            collaborationConfig?.pad_url ? (
              <iframe
                title="script-collaboration-pad"
                src={collaborationConfig.pad_url}
                className="w-full flex-1 border-0 min-h-0 bg-white/5"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[hsl(220_10%_55%)]">
                协作链接不可用
              </div>
            )
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="开始编写剧本...&#10;&#10;1. INT. 办公室 - 白天&#10;&#10;角色名&#10;对话内容..."
              className="flex-1 w-full resize-none bg-[hsl(228_15%_8%)] text-[hsl(220_15%_90%)] p-8 font-['JetBrains_Mono','Courier_New',monospace] text-sm leading-6 outline-none placeholder:text-[hsl(220_10%_30%)]"
              spellCheck={false}
            />
          )}

          <ScriptEditorStatusBar
            cnCharCount={cnCharCount}
            enWordCount={enWordCount}
            sceneCount={sceneCount}
            estimatedMinutes={estimatedMinutes}
            isCollaborationMode={isCollaborationMode}
          />

          <ScriptEditorCommentsPanel open={commentsOpen} targetId={id} />
        </div>

      <ScriptEditorOutlinePanel
        open={outlineOpen}
        outline={outline}
        onClose={() => setOutlineOpen(false)}
        onNavigate={scrollToPosition}
      />
      </div>

      <ScriptEditorVersionHistoryDrawer
        open={historyOpen}
        versions={versions}
        previewVersion={previewVersion}
        previewContent={previewContent}
        reverting={reverting}
        onClose={() => {
          setHistoryOpen(false);
          setPreviewVersion(null);
        }}
        onSelectVersion={handlePreviewVersion}
        onRevert={handleRevert}
      />
    </div>
  );
};

export default ScriptEditorPage;
