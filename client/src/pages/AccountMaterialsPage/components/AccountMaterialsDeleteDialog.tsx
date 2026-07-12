import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UserMaterialItem } from '@shared/material.interface';
import { useCallback } from 'react';

interface AccountMaterialsDeleteDialogProps {
  item: UserMaterialItem | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AccountMaterialsDeleteDialog = ({
  item,
  deleting,
  onCancel,
  onConfirm,
}: AccountMaterialsDeleteDialogProps) => {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onCancel();
    },
    [onCancel],
  );

  return (
    <Dialog open={!!item} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            确定要删除素材「{item?.title}」吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={deleting}
            className="border-border text-muted-foreground"
          >
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

