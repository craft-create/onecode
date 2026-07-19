import React from 'react';
import { motion } from 'framer-motion';
import { Film, Users, Clock, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image } from '@client/src/components/ui/image';
import type { ScriptProjectItem } from '@shared/script.interface';

export interface ScriptProjectCardProps {
  project: ScriptProjectItem;
  index: number;
  onOpen: (projectId: string) => void;
  onDelete: (project: ScriptProjectItem) => void;
  canDelete: boolean;
  typeLabel: string;
  formatTime: (iso: string) => string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
};

const ScriptProjectCard: React.FC<ScriptProjectCardProps> = ({
  project,
  index,
  onOpen,
  onDelete,
  canDelete,
  typeLabel,
  formatTime,
}) => {
  return (
    <motion.div
      key={project.id}
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ scale: 1.03 }}
      className="group relative cursor-pointer rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-shadow duration-300"
      onClick={() => onOpen(project.id)}
    >
      <div>
        <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(228_14%_18%)] to-[hsl(228_14%_8%)] relative overflow-hidden">
          {project.cover_url ? (
            <Image
              src={project.cover_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="size-10 text-[hsl(220_10%_30%)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(228_15%_8%)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <motion.div
            className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          >
            <p className="text-xs text-[hsl(220_15%_90%)] line-clamp-2">
              {project.description || '暂无描述'}
            </p>
          </motion.div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-[hsl(220_15%_90%)] truncate text-sm">
              {project.title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
              {typeLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-[hsl(220_10%_55%)]">
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {project.collaborator_count}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatTime(project.updated_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {canDelete ? (
          <Button
            variant="destructive"
            size="icon"
            className="size-8"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(project);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
};

export default ScriptProjectCard;
