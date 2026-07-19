import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CommentSection from '@client/src/components/CommentSection';

interface ScriptEditorCommentsPanelProps {
  open: boolean;
  targetId: string;
}

const ScriptEditorCommentsPanel: React.FC<ScriptEditorCommentsPanelProps> = ({
  open,
  targetId,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden border-t border-[hsl(228_12%_18%)]"
        >
          <div className="max-h-80 overflow-y-auto p-4">
            <CommentSection targetId={targetId} targetType="script" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScriptEditorCommentsPanel;

