import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => Promise<void>;
}

export function NotificationHeader({
  unreadCount,
  onMarkAllAsRead,
}: NotificationHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6" />
        <h1 className="text-2xl font-bold">通知中心</h1>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
      </div>
      {unreadCount > 0 && (
        <Button variant="outline" onClick={onMarkAllAsRead}>
          <CheckCircle className="w-4 h-4 mr-2" />
          全部已读
        </Button>
      )}
    </div>
  );
}

