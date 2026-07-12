import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Star, Search, Filter } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';
import type { ScriptTemplate } from '@shared/types';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, [category]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates', { params: { category } });
      setTemplates(res.data || []);
    } catch (error) {
      console.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          剧本模板市场
        </h1>
        <p className="text-gray-500 mt-1">使用专业模板快速创建剧本</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="搜索模板..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无模板</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card
              key={template.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/templates/${template.id}`)}
            >
              {template.coverUrl && (
                <img
                  src={template.coverUrl}
                  alt={template.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{template.title}</h3>
                  {template.isPremium && (
                    <Badge variant="secondary">付费</Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{template.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{template.rating}</span>
                  </div>
                  <span className="text-gray-500">{template.usageCount} 次使用</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
