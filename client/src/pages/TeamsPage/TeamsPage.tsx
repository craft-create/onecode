import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';
import type { Team } from '@shared/types';
import { PageFrame } from '../shared/PageShell';

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get<Team[]>('/teams');
      setTeams(Array.isArray(res) ? res : []);
    } catch {
      console.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageFrame
      title="团队协作"
      description="与团队成员协同创作"
      className="min-h-screen bg-background"
      containerClassName="app-container-shell"
      contentClassName="space-y-6"
      action={
        <Button onClick={() => navigate('/teams/new')}>
          <Plus className="w-4 h-4 mr-2" />
          创建团队
        </Button>
      }
    >

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索团队..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无团队</p>
          <Button className="mt-4" onClick={() => navigate('/teams/new')}>
            创建第一个团队
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => (
            <Card
              key={team.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Badge variant={team.isPublic ? 'default' : 'secondary'}>
                  {team.isPublic ? '公开' : '私有'}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-2">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{team.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {team.memberCount} 成员
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
