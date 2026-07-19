import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type {
  ChangeEvent,
  Dispatch,
  FC,
  KeyboardEvent,
  MouseEvent,
  SetStateAction,
} from 'react';
import type { FavoriteFolderItem } from '@shared/material.interface';

interface FavoriteFolderSidebarProps {
  folders: FavoriteFolderItem[];
  loading: boolean;
  selectedId: string | null;
  menuOpenId: string | null;
  editingId: string | null;
  showNewInput: boolean;
  creating: boolean;
  editName: string;
  newFolderName: string;
  onSetSelectedId: Dispatch<SetStateAction<string | null>>;
  onSetEditingId: Dispatch<SetStateAction<string | null>>;
  onSetEditName: Dispatch<SetStateAction<string>>;
  onSetMenuOpenId: Dispatch<SetStateAction<string | null>>;
  onSetShowNewInput: Dispatch<SetStateAction<boolean>>;
  onSetNewFolderName: Dispatch<SetStateAction<string>>;
  onCreateFolder: () => Promise<void> | void;
  onRename: (folderId: string) => Promise<void> | void;
  onDelete: (folderId: string) => Promise<void> | void;
}

export const FavoriteFolderSidebar: FC<FavoriteFolderSidebarProps> = ({
  folders,
  loading,
  selectedId,
  menuOpenId,
  editingId,
  showNewInput,
  creating,
  editName,
  newFolderName,
  onSetSelectedId,
  onSetEditingId,
  onSetEditName,
  onSetMenuOpenId,
  onSetShowNewInput,
  onSetNewFolderName,
  onCreateFolder,
  onRename,
  onDelete,
}) => {
  const handleFolderKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    folderId: string,
  ) => {
    if (event.key === 'Enter') {
      onRename(folderId);
    }
    if (event.key === 'Escape') {
      onSetEditingId(null);
    }
  };

  const handleNewInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      onCreateFolder();
    }
    if (event.key === 'Escape') {
      onSetShowNewInput(false);
      onSetNewFolderName('');
    }
  };

  return (
    <div className="w-64 shrink-0">
      <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg overflow-hidden">
        <div className="p-3 border-b border-[hsl(228_12%_18%)]">
          <h2 className="text-xs font-medium text-[hsl(220_10%_55%)] uppercase tracking-wider">收藏夹</h2>
        </div>

        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i: number) => (
              <div
                key={i}
                className="h-9 bg-[hsl(228_12%_18%)] rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="p-2 max-h-[60vh] overflow-y-auto">
            <AnimatePresence>
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="relative group"
                >
                  {editingId === folder.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onSetEditName(e.target.value)
                        }
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleFolderKeyDown(e, folder.id)}
                        onBlur={() => onRename(folder.id)}
                        autoFocus
                        className="flex-1 h-7 px-2 rounded-md bg-[hsl(228_15%_8%)] border border-primary/50 text-xs text-[hsl(220_15%_90%)] outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetSelectedId(folder.id)}
                      onDoubleClick={() => {
                        onSetEditingId(folder.id);
                        onSetEditName(folder.name);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedId === folder.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)]'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className="text-xs text-[hsl(220_10%_40%)]">
                        {folder.item_count}
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onSetMenuOpenId(menuOpenId === folder.id ? null : folder.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[hsl(228_12%_18%)] transition-all"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <AnimatePresence>
                          {menuOpenId === folder.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute left-0 top-full mt-1 w-32 bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg shadow-xl z-50 py-1"
                            >
                              <button
                                type="button"
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  onSetEditingId(folder.id);
                                  onSetEditName(folder.name);
                                  onSetMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                重命名
                              </button>
                              <button
                                type="button"
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  onDelete(folder.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                删除
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {folders.length === 0 ? (
              <p className="text-xs text-[hsl(220_10%_55%)] text-center py-4">
                暂无收藏夹
              </p>
            ) : null}
          </div>
        )}

        <div className="p-2 border-t border-[hsl(228_12%_18%)]">
          <AnimatePresence>
            {showNewInput ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onSetNewFolderName(e.target.value)
                    }
                    onKeyDown={handleNewInputKeyDown}
                    placeholder="收藏夹名称..."
                    autoFocus
                    className="flex-1 h-8 px-2 rounded-md bg-[hsl(228_15%_8%)] border border-[hsl(228_12%_18%)] text-xs text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)] outline-none focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={onCreateFolder}
                    disabled={creating || !newFolderName.trim()}
                    className="app-btn-icon"
                  >
                    {creating ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetShowNewInput(false);
                      onSetNewFolderName('');
                    }}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => onSetShowNewInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建收藏夹
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
