import { motion, AnimatePresence } from 'framer-motion';
import { Film, FileText, X, Bookmark } from 'lucide-react';
import type { FC, MouseEvent } from 'react';
import type { FavoriteFolderContentItem, FavoriteFolderItem } from '@shared/material.interface';
import { Image } from '@/components/ui/image';

interface FavoriteItemsPanelProps {
  selectedId: string | null;
  selectedFolder: FavoriteFolderItem | undefined;
  itemsLoading: boolean;
  items: FavoriteFolderContentItem[];
  onItemClick: (item: FavoriteFolderContentItem) => void;
  onRemoveItem: (itemId: string) => Promise<void> | void;
}

export const FavoriteItemsPanel: FC<FavoriteItemsPanelProps> = ({
  selectedId,
  selectedFolder,
  itemsLoading,
  items,
  onItemClick,
  onRemoveItem,
}) => {
  if (!selectedId) {
    return (
      <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg flex flex-col items-center justify-center py-20">
        <Bookmark className="w-12 h-12 text-[hsl(220_10%_30%)] mb-4" />
        <p className="text-[hsl(220_10%_55%)] text-sm">
          选择一个收藏夹查看内容
        </p>
      </div>
    );
  }

  if (itemsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i: number) => (
          <div
            key={i}
            className="rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] animate-pulse h-48"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg flex flex-col items-center justify-center py-20">
        <Film className="w-12 h-12 text-[hsl(220_10%_30%)] mb-4" />
        <p className="text-[hsl(220_10%_55%)] text-sm">
          收藏夹为空，去发现精彩内容吧
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[hsl(220_15%_90%)]">
          {selectedFolder?.name}
        </h2>
        <p className="text-xs text-[hsl(220_10%_55%)] mt-0.5">
          {items.length} 个项目
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="group relative rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-all duration-300 cursor-pointer"
              onClick={() => onItemClick(item)}
            >
              <div className="aspect-video bg-gradient-to-br from-[hsl(228_14%_18%)] to-[hsl(228_14%_8%)] flex items-center justify-center">
                {item.cover_url ? (
                  <Image
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : item.type === 'material' ? (
                  <Film className="w-10 h-10 text-[hsl(220_10%_30%)]" />
                ) : (
                  <FileText className="w-10 h-10 text-[hsl(220_10%_30%)]" />
                )}
              </div>

              <div className="p-3">
                <h3 className="text-sm font-medium text-[hsl(220_15%_90%)] truncate">{item.title}</h3>
                <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5">
                  {item.type === 'material' ? '素材' : '剧本'}
                </p>
              </div>

              <button
                type="button"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
