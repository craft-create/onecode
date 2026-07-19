import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FileManagerNewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

const FileManagerNewFolderDialog: React.FC<FileManagerNewFolderDialogProps> = ({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建文件夹</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">文件夹名称</Label>
            <Input
              id="folderName"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="输入文件夹名称"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSubmit}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileManagerNewFolderDialog;
