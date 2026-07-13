import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, FolderOpen, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamDetail();
  }, [teamId]);

  const fetchTeamDetail = async () => {
    try {
      const res = await api.get(`/teams/${teamId}`);
      setTeam((res as { team?: unknown }).team || null);
      setMembers((res as { members?: unknown[] }).members || []);
    } catch (error) {
      console.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-gray-500">团队不存在</p>
        <Button className="mt-4" onClick={() => navigate('/teams')}>
          返回团队列表
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate('/teams')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </Button>

      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
            {team.description && (
              <p className="text-gray-600">{team.description}</p>
            )}
          </div>
          <Badge variant={team.isPublic ? 'default' : 'secondary'}>
            {team.isPublic ? '公开团队' : '私有团队'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 团队资源 */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">团队资源</h2>
              <Button size="sm" variant="outline">
                <FolderOpen className="w-4 h-4 mr-2" />
                分享资源
              </Button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无共享资源</p>
            </div>
          </Card>

          {/* 项目列表 */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">团队项目</h2>
              <Button size="sm" variant="outline" onClick={() => navigate('/projects')}>
                <Plus className="w-4 h-4 mr-2" />
                创建项目
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 成员列表 */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">成员 ({members.length})</h2>
              <Button size="sm" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                邀请成员
              </Button>
            </div>
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white">
                    {member.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 团队信息 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">团队信息</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">创建时间</p>
                <p>{new Date(team.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <div>
                <p className="text-gray-500">成员数</p>
                <p>{team.memberCount} 人</p>
              </div>
              <div>
                <p className="text-gray-500">所有者</p>
                <p>{team.owner?.name || 'Unknown'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
