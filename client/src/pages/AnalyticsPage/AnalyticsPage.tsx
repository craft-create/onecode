import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, Heart, Download, Share2, TrendingUp } from 'lucide-react';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';
import { PageFrame } from '../shared/PageShell';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [contentStats, setContentStats] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [dashboardRes] = await Promise.all([
        api.get('/analytics/dashboard'),
      ]);
      setDashboard(dashboardRes as unknown as Record<string, unknown>);
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <PageFrame
        title="数据中心"
        description="查看您的内容表现数据"
        className="min-h-screen bg-background"
        containerClassName="max-w-6xl mx-auto px-4 py-8"
        contentClassName="space-y-6"
      >
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </PageFrame>
    );
  }

  const stats = [
    { label: '总浏览量', value: '12.5K', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '总点赞数', value: '3.2K', icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    { label: '总下载数', value: '856', icon: Download, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '总分享数', value: '234', icon: Share2, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const weeklyData = [
    { name: '周一', views: 400, likes: 24, downloads: 12 },
    { name: '周二', views: 300, likes: 18, downloads: 8 },
    { name: '周三', views: 600, likes: 32, downloads: 20 },
    { name: '周四', views: 800, likes: 40, downloads: 25 },
    { name: '周五', views: 500, likes: 28, downloads: 15 },
    { name: '周六', views: 900, likes: 50, downloads: 30 },
    { name: '周日', views: 700, likes: 38, downloads: 22 },
  ];

  const categoryData = [
    { name: '视频素材', value: 35 },
    { name: '音频素材', value: 25 },
    { name: '剧本', value: 20 },
    { name: '图片素材', value: 20 },
  ];

  return (
    <PageFrame
      title="数据中心"
      description="查看您的内容表现数据"
      className="min-h-screen bg-background"
      containerClassName="max-w-6xl mx-auto px-4 py-8"
      contentClassName="space-y-6"
    >

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 趋势图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">近7天数据趋势</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" name="浏览量" />
              <Line type="monotone" dataKey="likes" stroke="#ef4444" name="点赞数" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">内容分类分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 下载趋势 */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">下载量趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="downloads" fill="#10b981" name="下载数" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 热门内容 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">热门内容</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">#{i + 1}</Badge>
                <span className="font-medium">示例内容 {i + 1}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {Math.floor(Math.random() * 1000)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {Math.floor(Math.random() * 100)}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {Math.floor(Math.random() * 50)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageFrame>
  );
}
