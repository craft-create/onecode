import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Eye, Download, Heart, Share2 } from 'lucide-react';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { analyticsApi } from '@client/src/api';
import { PageFrame } from '../shared/PageShell';
import type { AnalyticsDashboardData } from '@shared/types';

const chartColors = ['#6366f1', '#0ea5e9', '#ec4899', '#f59e0b', '#10b981'];

const toReadableNumber = (value: number): string => {
  const normalized = Number(value || 0);
  return normalized.toLocaleString('zh-CN');
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(
    null,
  );

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await analyticsApi.getDashboard();
        setDashboardData(data);
      } catch (_error) {
        setError('数据加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const defaultData: AnalyticsDashboardData = {
    totalViews: 0,
    totalLikes: 0,
    totalDownloads: 0,
    totalShares: 0,
    totalFavorites: 0,
    totalContents: 0,
    weeklyTrend: [],
    categoryDistribution: [],
    topContents: [],
  };
  const data = dashboardData ?? defaultData;

  if (error) {
    return (
      <PageFrame
        title="数据中心"
        description="查看您的内容表现数据"
        className="min-h-screen bg-background"
        containerClassName="app-container-shell"
        contentClassName="space-y-6"
      >
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-6">
          {error}
        </div>
      </PageFrame>
    );
  }

  if (loading) {
    return (
      <PageFrame
        title="数据中心"
        description="查看您的内容表现数据"
        className="min-h-screen bg-background"
        containerClassName="app-container-shell"
        contentClassName="space-y-6"
      >
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </PageFrame>
    );
  }

  const stats = [
    { label: '总浏览量', value: data.totalViews, icon: Eye, color: 'text-blue-400' },
    { label: '总点赞数', value: data.totalLikes, icon: Heart, color: 'text-pink-400' },
    { label: '总下载数', value: data.totalDownloads, icon: Download, color: 'text-green-400' },
    { label: '总分享数', value: data.totalShares, icon: Share2, color: 'text-violet-400' },
  ];

  const weeklyData = data.weeklyTrend.map((item) => ({
    name: item.date,
    views: item.views,
    likes: item.likes,
    downloads: item.downloads,
    shares: item.shares,
  }));

  const categoryData = data.categoryDistribution.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  const topContents = data.topContents.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return (
    <PageFrame
      title="数据中心"
      description="查看您的内容表现数据"
      className="min-h-screen bg-background"
      containerClassName="app-container-shell"
      contentClassName="space-y-6"
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{toReadableNumber(stat.value)}</p>
              </div>
              <div className="p-3 rounded-full bg-muted">
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
              <Line type="monotone" dataKey="views" stroke={chartColors[0]} name="浏览量" />
              <Line type="monotone" dataKey="likes" stroke={chartColors[1]} name="点赞数" />
              <Line type="monotone" dataKey="downloads" stroke={chartColors[2]} name="下载数" />
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
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 下载趋势 */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">下载趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="downloads" fill={chartColors[3]} name="下载数" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 热门内容 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">热门内容</h2>
        <div className="space-y-4">
          {topContents.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              暂无内容行为数据
            </div>
          )}
          {topContents.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="secondary">#{item.rank}</Badge>
                <div className="min-w-0">
                  <p className="font-medium truncate" title={item.title}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {toReadableNumber(item.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {toReadableNumber(item.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {toReadableNumber(item.downloads)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageFrame>
  );
}
