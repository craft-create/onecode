import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Folder, Loader2 } from 'lucide-react';
import FileManagerFileItem from '@/components/file/FileManagerFileItem';
import type { FileItemData } from '@/components/file/FileManagerFileItem';
import FileManagerFolderItem from '@/components/file/FileManagerFolderItem';
import type { FileItem, FolderItem, ViewMode } from '../FileManagerPage';

interface FileManagerExplorerContentProps {
  loading: boolean;
  folders: FolderItem[];
  files: FileItem[];
  viewMode: ViewMode;
  selectedItems: Set<string>;
  isStarred: (value: number | boolean | string) => boolean;
  onNavigateFolder: (folder: FolderItem) => void;
  onOpenFile: (file: FileItemData) => void;
  onToggleSelect: (id: string) => void;
  onToggleStar: (fileId: string, event?: React.MouseEvent) => void;
  onShare: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  formatSize: (size?: number) => string;
}

const FileManagerExplorerContent: React.FC<FileManagerExplorerContentProps> = ({
  loading,
  folders,
  files,
  viewMode,
  selectedItems,
  isStarred,
  onNavigateFolder,
  onOpenFile,
  onToggleSelect,
  onToggleStar,
  onShare,
  onDownload,
  onDelete,
  formatSize,
}) => {
  return (
    <>
      {/* ===== Content ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {folders.length === 0 && files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Folder className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">此文件夹为空</p>
            </motion.div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">文件夹</h2>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                        : 'space-y-2'
                    }
                  >
                    {folders.map((folder) => (
                      <FileManagerFolderItem
                        key={folder.id}
                        folder={folder}
                        viewMode={viewMode}
                        selected={selectedItems.has(folder.id)}
                        onNavigate={onNavigateFolder}
                        onToggleSelect={onToggleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">文件</h2>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                        : 'space-y-2'
                    }
                  >
                    {files.map((file) => (
                      <FileManagerFileItem
                        key={file.id}
                        file={file}
                        viewMode={viewMode}
                        selected={selectedItems.has(file.id)}
                        onOpen={onOpenFile}
                        onToggleSelect={onToggleSelect}
                        onToggleStar={(event) => onToggleStar(file.id, event)}
                        onShare={(event) => {
                          event.stopPropagation();
                          onShare(file);
                        }}
                        onDownload={(event) => {
                          event.stopPropagation();
                          onDownload(file);
                        }}
                        onDelete={(event) => {
                          event.stopPropagation();
                          onDelete(file);
                        }}
                        formatSize={formatSize}
                        isStarred={isStarred(file.isStarred)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default FileManagerExplorerContent;
