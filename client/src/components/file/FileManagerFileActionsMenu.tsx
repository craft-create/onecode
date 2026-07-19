import React from 'react';
import { Star, Share2, Download, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface FileManagerFileActionsMenuProps {
  isStarred: boolean;
  triggerVariant: 'secondary' | 'ghost';
  onToggleStar: (event: React.MouseEvent) => void;
  onShare: (event: React.MouseEvent) => void;
  onDownload: (event: React.MouseEvent) => void;
  onDelete: (event: React.MouseEvent) => void;
}

const FileManagerFileActionsMenu: React.FC<FileManagerFileActionsMenuProps> = ({
  isStarred,
  triggerVariant,
  onToggleStar,
  onShare,
  onDownload,
  onDelete,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant={triggerVariant}
        size="icon"
        className="w-8 h-8"
        onClick={(event) => event.stopPropagation()}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onToggleStar}>
        <Star className="w-4 h-4 mr-2" />
        {isStarred ? '取消收藏' : '收藏'}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onShare}>
        <Share2 className="w-4 h-4 mr-2" />
        分享
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onDownload}>
        <Download className="w-4 h-4 mr-2" />
        下载
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onDelete} className="text-destructive">
        <Trash2 className="w-4 h-4 mr-2" />
        删除
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default FileManagerFileActionsMenu;
