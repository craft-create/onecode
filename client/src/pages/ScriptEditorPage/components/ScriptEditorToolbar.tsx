import React from 'react';
import {
  Download,
  History,
  List,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LikeButton from '@client/src/components/LikeButton';
import FavoriteButton from '@client/src/components/FavoriteButton';

interface ScriptEditorToolbarProps {
  id: string;
  version: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isCollaborationMode: boolean;
  isCollaborationEditable: boolean;
  outlineOpen: boolean;
  commentsOpen: boolean;
  collabSyncing: boolean;
  isLiked: boolean;
  likeCount: number;
  saving: boolean;
  onBack: () => void;
  onToggleOutline: () => void;
  onOpenHistory: () => void;
  onToggleComments: () => void;
  onSyncCollaboration: () => void;
  onManualSave: () => void;
  onExport: () => void;
}

const ScriptEditorToolbar: React.FC<ScriptEditorToolbarProps> = ({
  id,
  version,
  saveStatus,
  isCollaborationMode,
  isCollaborationEditable,
  outlineOpen,
  commentsOpen,
  collabSyncing,
  isLiked,
  likeCount,
  saving,
  onBack,
  onToggleOutline,
  onOpenHistory,
  onToggleComments,
  onSyncCollaboration,
  onManualSave,
  onExport,
}) => {
  const saveStatusClass =
    saveStatus === 'saved'
      ? 'bg-[hsl(152_65%_45%)]/20 text-[hsl(152_65%_45%)]'
      : saveStatus === 'saving'
        ? 'bg-[hsl(38_90%_55%)]/20 text-[hsl(38_90%_55%)]'
        : 'bg-[hsl(0_72%_55%)]/20 text-[hsl(0_72%_55%)]';

  const saveStatusLabel =
    saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存';

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)]/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]"
        >
          ← 返回
        </Button>
        <span className="text-sm text-[hsl(220_10%_55%)]">{version}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${saveStatusClass}`}>{saveStatusLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        {isCollaborationMode && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] border border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] text-[hsl(220_10%_55%)]">
            <Users className="size-3.5" />
            Etherpad 协作编辑
            {isCollaborationEditable ? (
              <span className="text-[hsl(152_65%_45%)]">（可编辑）</span>
            ) : (
              <>
                <Lock className="size-3.5" />
                <span className="text-[hsl(38_90%_55%)]">只读</span>
              </>
            )}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleOutline}
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
          onClick={onOpenHistory}
          className="gap-1.5 border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)]"
        >
          <History className="size-3.5" />
          版本
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleComments}
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
          onClick={onExport}
          className="gap-1.5 border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)]"
        >
          <Download className="size-3.5" />
          导出
        </Button>
        {isCollaborationMode && isCollaborationEditable && (
          <Button
            size="sm"
            onClick={onSyncCollaboration}
            disabled={collabSyncing}
            className="app-btn-primary-compact"
          >
            <RefreshCw className="size-3.5" />
            {collabSyncing ? '同步中...' : '同步协作内容'}
          </Button>
        )}
        <div className="flex items-center gap-1.5">
          <LikeButton targetId={id} targetType="script" initialLiked={isLiked} initialCount={likeCount} />
          <FavoriteButton targetId={id} targetType="script" />
        </div>
        {!isCollaborationMode && (
          <Button size="sm" onClick={onManualSave} disabled={saving} className="app-btn-primary-compact">
            <Save className="size-3.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ScriptEditorToolbar;
