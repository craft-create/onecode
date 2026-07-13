import { Check } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import type { Notification } from '@shared/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => Promise<void>;
  onOpen?: (notification: Notification) => void;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return '❤️';
    case 'favorite':
      return '⭐';
    case 'comment':
      return '💬';
    case 'follow':
      return '👤';
    case 'message':
      return '✉️';
    default:
      return '🔔';
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onOpen,
}: NotificationItemProps) {
  const isUnread = notification.isRead === 0;

  return (
    <Card
      key={notification.id}
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
      onClick={() => onOpen?.(notification)}
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm">{notification.title}</h3>
              {notification.content && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
              )}
            </div>
            {isUnread && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={event => {
                  event.stopPropagation();
                  void onMarkAsRead(notification.id);
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notification.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>
    </Card>
  );
}
