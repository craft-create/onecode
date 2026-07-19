import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FileItem } from '../FileManagerPage';

interface FileManagerShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareItem: FileItem | null;
  shareExpiresIn: number;
  sharePassword: string;
  onExpiresInChange: (value: number) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

const FileManagerShareDialog: React.FC<FileManagerShareDialogProps> = ({
  open,
  onOpenChange,
  shareItem,
  shareExpiresIn,
  sharePassword,
  onExpiresInChange,
  onPasswordChange,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享文件</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>分享文件</Label>
            <p className="text-sm text-muted-foreground">{shareItem?.name}</p>
          </div>
          <div className="space-y-2">
            <Label>有效期（小时）</Label>
            <Input
              type="number"
              value={shareExpiresIn}
              onChange={(e) => onExpiresInChange(parseInt(e.target.value, 10))}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>分享密码（可选）</Label>
            <Input
              type="password"
              value={sharePassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="留空则公开访问"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSubmit}>
            生成分享链接
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileManagerShareDialog;
