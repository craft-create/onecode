import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { ScriptOutlineItem } from '@shared/script.interface';

interface ScriptEditorOutlinePanelProps {
  open: boolean;
  outline: ScriptOutlineItem[];
  onClose: () => void;
  onNavigate: (position: number) => void;
}

const ScriptEditorOutlinePanel: React.FC<ScriptEditorOutlinePanelProps> = ({
  open,
  outline,
  onClose,
  onNavigate,
}) => {
  return (
    <>
      {open ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="border-l border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] overflow-hidden shrink-0"
        >
          <div className="w-[260px] h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(228_12%_18%)]">
              <span className="text-sm font-medium text-[hsl(220_15%_90%)]">场景大纲</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
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
                outline.map((item: ScriptOutlineItem) => (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => onNavigate(item.position)}
                    className="w-full text-left px-3 py-2 rounded-md text-xs text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)] transition-colors flex items-center gap-2"
                  >
                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0">
                      {item.index}
                    </Badge>
                    <span className="truncate">{item.scene_header}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </>
  );
};

export default ScriptEditorOutlinePanel;
