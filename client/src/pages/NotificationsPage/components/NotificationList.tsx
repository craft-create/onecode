import type { Notification } from '@shared/types';
import { NotificationEmptyState } from './NotificationEmptyState';
import { NotificationItem } from './NotificationItem';
import { NotificationLoadingState } from './NotificationLoadingState';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onOpenNotification: (notification: Notification) => void;
}

export function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onOpenNotification,
}: NotificationListProps) {
  if (loading) {
    return <NotificationLoadingState />;
  }

  if (notifications.length === 0) {
    return <NotificationEmptyState />;
  }

  return (
    <div className="space-y-3">
      {notifications.map(item => (
        <NotificationItem
          key={item.id}
          notification={item}
          onMarkAsRead={onMarkAsRead}
          onOpen={onOpenNotification}
        />
      ))}
    </div>
  );
}

