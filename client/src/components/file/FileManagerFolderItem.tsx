import React from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export interface FolderItemData {
  id: string;
  name: string;
  itemCount: number;
  isStarred: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface FileManagerFolderItemProps {
  folder: FolderItemData;
  viewMode: 'grid' | 'list';
  selected: boolean;
  onNavigate: (folder: FolderItemData) => void;
  onToggleSelect: (folderId: string) => void;
}

const FileManagerFolderItem: React.FC<FileManagerFolderItemProps> = ({
  folder,
  viewMode,
  selected,
  onNavigate,
  onToggleSelect,
}) => {
  const folderColor = folder.color || '#3b82f6';
  const iconColor = folderColor;

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group"
      >
        <Card
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
          onClick={() => onNavigate(folder)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${folderColor}20` }}>
                {folder.isStarred ? (
                  <FolderOpen className="w-6 h-6" style={{ color: iconColor }} />
                ) : (
                  <Folder className="w-6 h-6" style={{ color: iconColor }} />
                )}
              </div>
              <p className="text-sm font-medium truncate w-full">{folder.name}</p>
              <p className="text-xs text-muted-foreground">{folder.itemCount} 项</p>
            </div>
          </CardContent>
        </Card>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(folder.id)}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-all"
      onClick={() => onNavigate(folder)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(folder.id)}
          onClick={(event) => event.stopPropagation()}
        />
        <Folder className="w-5 h-5" style={{ color: iconColor }} />
        <span className="flex-1 font-medium">{folder.name}</span>
        <span className="text-sm text-muted-foreground">{folder.itemCount} 项</span>
      </CardContent>
    </Card>
  );
};

export default FileManagerFolderItem;
