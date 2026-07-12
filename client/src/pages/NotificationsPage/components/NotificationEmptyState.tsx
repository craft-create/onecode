import { Bell } from 'lucide-react';
import { Card } from '@client/src/components/ui/card';

export function NotificationEmptyState() {
  return (
    <Card className="p-12 text-center">
      <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-500">暂无通知</p>
    </Card>
  );
}

