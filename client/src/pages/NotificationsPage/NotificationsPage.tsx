import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { Badge } from '@client/src/components/ui/badge';
import { api } from '@client/src/api';
import type { Notification } from '@shared/types';
import { PageFrame } from '../shared/PageShell';
import { PageErrorState } from '../shared/PageStatePanel';
import { NotificationHeader } from './components/NotificationHeader';
import { NotificationList } from './components/NotificationList';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unread');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { type: activeTab === 'unread' ? undefined : activeTab, isRead: activeTab === 'unread' ? 0 : undefined } }),
        api.get('/notifications/unread/count'),
      ]);
      const listData = (listRes as { items?: Notification[]; } )?.items || [];
      const countData = typeof countRes === 'number'
        ? countRes
        : (countRes as { count?: unknown })?.count;
      setNotifications(Array.isArray(listData) ? listData : []);
      const unreadCount = typeof countData === 'number'
        ? countData
        : Number(countData ?? 0);
      setUnreadCount(Number.isFinite(unreadCount) ? unreadCount : 0);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      console.error('[NotificationsPage] load failed', status, error);
      setError(status ? `加载通知失败（HTTP ${status}）` : '加载通知失败');
      toast.error(status ? `加载通知失败（HTTP ${status}）` : '加载通知失败');
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

  const handleOpenNotification = (notification: Notification) => {
    if (notification.sourceType && notification.sourceId) {
      navigate(`/${notification.sourceType}s/${notification.sourceId}`);
    }
  };

  if (error) {
    return <PageErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <PageFrame
      className="min-h-screen bg-background"
      containerClassName="container mx-auto py-8 max-w-4xl"
      contentClassName="space-y-6"
    >
      <NotificationHeader unreadCount={unreadCount} onMarkAllAsRead={handleMarkAllAsRead} />

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
          <NotificationList
            notifications={notifications}
            loading={loading}
            onMarkAsRead={handleMarkAsRead}
            onOpenNotification={handleOpenNotification}
          />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
