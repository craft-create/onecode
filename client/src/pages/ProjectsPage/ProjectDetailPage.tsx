import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Users, BarChart3 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Progress } from '@client/src/components/ui/progress';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { api } from '@client/src/api';
import { PageFrame } from '../shared/PageShell';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetail();
  }, [projectId]);

  const fetchProjectDetail = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      const projectRes = res as { project?: Record<string, unknown> } & { tasks?: unknown[] };
      setProject((projectRes as { project: any }).project ?? (projectRes as any));
      setTasks(Array.isArray(projectRes.tasks) ? projectRes.tasks : []);
    } catch (error) {
      console.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageFrame
        title="项目详情"
        description="加载中"
        className="min-h-screen bg-background"
        containerClassName="max-w-6xl mx-auto px-4 py-8"
        contentClassName="space-y-6"
      >
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </PageFrame>
    );
  }

  if (!project) {
    return (
      <PageFrame
        title="项目不存在"
        className="min-h-screen bg-background"
        containerClassName="max-w-6xl mx-auto px-4 py-8"
        contentClassName="flex flex-col items-center"
      >
        <p className="text-gray-500">项目不存在</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          返回项目列表
        </Button>
      </PageFrame>
    );
  }

  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  return (
    <PageFrame
      title={project.name}
      description={project.description}
      className="min-h-screen bg-background"
      containerClassName="max-w-6xl mx-auto px-4 py-8"
      contentClassName="space-y-6"
      action={
        <Button onClick={() => navigate(`/projects/${projectId}/tasks/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          新建任务
        </Button>
      }
    >
      <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">进度</p>
              <p className="text-2xl font-bold">{project.progress}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold">{inProgressTasks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold">{doneTasks}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">项目进度</h2>
          <Button variant="outline" size="sm" onClick={fetchProjectDetail}>
            更新进度
          </Button>
        </div>
        <Progress value={project.progress} className="h-3" />
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>待办: {todoTasks}</span>
          <span>进行中: {inProgressTasks}</span>
          <span>已完成: {doneTasks}</span>
        </div>
      </Card>

      <Tabs defaultValue="tasks">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks">任务板</TabsTrigger>
          <TabsTrigger value="comments">讨论</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['todo', 'in_progress', 'done'].map(status => {
              const statusTasks = tasks.filter(t => t.status === status);
              const statusLabels = { todo: '待办', in_progress: '进行中', done: '已完成' };
              const statusColors = { todo: 'bg-gray-500', in_progress: 'bg-blue-500', done: 'bg-green-500' };

              return (
                <Card key={status} className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                    <h3 className="font-semibold">{statusLabels[status as keyof typeof statusLabels]}</h3>
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {statusTasks.map(task => (
                      <Card key={task.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                        <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-gray-400 mt-2">
                            截止: {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="p-6">
            <p className="text-gray-500 text-center py-8">讨论功能开发中...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
