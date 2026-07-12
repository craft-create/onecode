import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Plus, Filter, DollarSign } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';

export default function RequirementsPage() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    fetchRequirements();
  }, [status]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requirements', { params: { status } });
      setRequirements(res.data || []);
    } catch (error) {
      console.error('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return '面议';
    return `¥${(budget / 100).toFixed(2)}`;
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            需求大厅
          </h1>
          <p className="text-gray-500 mt-1">发现创作需求，开启合作</p>
        </div>
        <Button onClick={() => navigate('/requirements/new')}>
          <Plus className="w-4 h-4 mr-2" />
          发布需求
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="搜索需求..." className="pl-9" />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">全部状态</option>
          <option value="open">招募中</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : requirements.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无需求</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requirements.map(req => (
            <Card
              key={req.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/requirements/${req.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{req.title}</h3>
                    <Badge variant={req.status === 'open' ? 'default' : 'secondary'}>
                      {req.status === 'open' ? '招募中' : req.status === 'in_progress' ? '进行中' : req.status}
                    </Badge>
                    <Badge variant="outline">
                      {req.type === 'material' ? '素材' : req.type === 'script' ? '剧本' : '制作'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 line-clamp-2 mb-3">{req.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    {req.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatBudget(req.budget)}
                      </span>
                    )}
                    {req.deadline && (
                      <span>
                        截止: {new Date(req.deadline).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                    <span>{req.applications} 人申请</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
