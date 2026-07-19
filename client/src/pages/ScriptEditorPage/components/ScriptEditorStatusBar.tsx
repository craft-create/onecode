import React from 'react';

interface ScriptEditorStatusBarProps {
  cnCharCount: number;
  enWordCount: number;
  sceneCount: number;
  estimatedMinutes: number;
  isCollaborationMode: boolean;
}

const ScriptEditorStatusBar: React.FC<ScriptEditorStatusBarProps> = ({
  cnCharCount,
  enWordCount,
  sceneCount,
  estimatedMinutes,
  isCollaborationMode,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-2 border-t border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] text-xs text-[hsl(220_10%_55%)]">
      <div className="flex items-center gap-4">
        <span>字数: {cnCharCount.toLocaleString()}</span>
        <span>单词: {enWordCount.toLocaleString()}</span>
        <span>场景: {sceneCount}</span>
        <span className="text-[hsl(220_10%_40%)]">|</span>
        <span>预估时长: ~{estimatedMinutes}分钟</span>
      </div>
      <span>
        {isCollaborationMode
          ? '协作模式：多人实时编辑'
          : 'Ctrl+S 保存'}
      </span>
    </div>
  );
};

export default ScriptEditorStatusBar;

