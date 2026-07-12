import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';
import type { Notification } from '@shared/types';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unread');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { type: activeTab === 'unread' ? undefined : activeTab, isRead: activeTab === 'unread' ? 0 : undefined } }),
        api.get('/notifications/unread/count'),
      ]);
      setNotifications(listRes.data.items || []);
      setUnreadCount(countRes.data);
    } catch (error) {
      toast.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('已标为已读');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
      toast.success('已全部标为已读');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const getNotificationIcon = (type: string) => {
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
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <h1 className="text-2xl font-bold">通知中心</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-2" />
            全部已读
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="unread">
            未读
            {unreadCount > 0 && <Badge className="ml-2" variant="secondary">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="like">点赞</TabsTrigger>
          <TabsTrigger value="favorite">收藏</TabsTrigger>
          <TabsTrigger value="comment">评论</TabsTrigger>
          <TabsTrigger value="follow">关注</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">暂无通知</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <Card
                  key={notification.id}
                  className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${notification.isRead === 0 ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
                  onClick={() => {
                    if (notification.sourceType && notification.sourceId) {
                      navigate(`/${notification.sourceType}s/${notification.sourceId}`);
                    }
                  }}
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
                        {notification.isRead === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
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
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
