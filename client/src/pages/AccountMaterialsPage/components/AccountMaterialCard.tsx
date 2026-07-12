import { memo, useMemo, useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Image } from '@client/src/components/ui/image';
import { Film, Trash2 } from 'lucide-react';
import type { UserMaterialItem } from '@shared/material.interface';

interface AccountMaterialCardProps {
  item: UserMaterialItem;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
};

export const AccountMaterialCard = memo(({ item, index, onClick, onDelete }: AccountMaterialCardProps) => {
  const formattedDate = useMemo(() => {
    const d = new Date(item.created_at);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, [item.created_at]);

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-all duration-300"
    >
      <div onClick={onClick} className="cursor-pointer">
        <div className="aspect-[16/10] bg-accent/30 relative overflow-hidden">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="size-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground truncate text-sm mb-2">{item.title}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button variant="destructive" size="icon" className="size-8" onClick={handleDeleteClick}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
});

AccountMaterialCard.displayName = 'AccountMaterialCard';
