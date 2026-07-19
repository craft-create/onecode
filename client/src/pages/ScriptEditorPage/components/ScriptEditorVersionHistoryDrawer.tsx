import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, X } from 'lucide-react';
import type { ScriptVersionItem } from '@shared/script.interface';

interface ScriptEditorVersionHistoryDrawerProps {
  open: boolean;
  versions: ScriptVersionItem[];
  previewVersion: ScriptVersionItem | null;
  previewContent: string;
  reverting: boolean;
  onClose: () => void;
  onSelectVersion: (versionItem: ScriptVersionItem) => void;
  onRevert: () => void;
}

const ScriptEditorVersionHistoryDrawer: React.FC<ScriptEditorVersionHistoryDrawerProps> = ({
  open,
  versions,
  previewVersion,
  previewContent,
  reverting,
  onClose,
  onSelectVersion,
  onRevert,
}) => {
  return (
    <>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-[hsl(228_14%_12%)] border-l border-[hsl(228_12%_18%)] z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(228_12%_18%)]">
              <h3 className="font-semibold text-[hsl(220_15%_90%)]">版本历史</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="size-7 p-0 text-[hsl(220_10%_55%)]"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {versions.map((versionItem: ScriptVersionItem) => (
                <div
                  key={versionItem.id}
                  className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                    previewVersion?.id === versionItem.id
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-[hsl(228_12%_18%)] hover:border-[hsl(220_10%_40%)]'
                  }`}
                  onClick={() => onSelectVersion(versionItem)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {versionItem.version}
                    </Badge>
                    <span className="text-[10px] text-[hsl(220_10%_55%)]">
                      {new Date(versionItem.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(220_10%_55%)] truncate">
                    {versionItem.snapshot_summary || '无描述'}
                  </p>
                  <p className="text-[10px] text-[hsl(220_10%_40%)] mt-0.5">
                    {versionItem.author_name || '未知作者'}
                  </p>
                </div>
              ))}
            </div>

            {previewVersion ? (
              <div className="border-t border-[hsl(228_12%_18%)] p-4 space-y-3">
                <div className="bg-[hsl(228_15%_8%)] rounded-md p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-[hsl(220_10%_55%)] font-mono whitespace-pre-wrap">
                    {previewContent || '(空内容)'}
                  </pre>
                </div>
                <Button
                  size="sm"
                  onClick={onRevert}
                  disabled={reverting}
                  className="w-full app-btn-primary-compact"
                >
                  <RotateCcw className="size-3.5" />
                  {reverting ? '回退中...' : `回退至 ${previewVersion.version}`}
                </Button>
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </>
  );
};

export default ScriptEditorVersionHistoryDrawer;
