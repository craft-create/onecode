import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';
import type { Project } from '@shared/types';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (error) {
      console.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-500';
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'archived': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="w-6 h-6" />
            项目工作台
          </h1>
          <p className="text-gray-500 mt-1">管理您的创意项目</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          创建项目
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderKanban className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无项目</p>
          <Button className="mt-4" onClick={() => navigate('/projects/new')}>
            创建第一个项目
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <Card
              key={project.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
                <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{project.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">进度</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.endDate).toLocaleDateString('zh-CN')}
                  </span>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex gap-1">
                    {project.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
