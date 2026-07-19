import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { logger } from '@/compat/client-toolkit/logger';
import { toast } from 'sonner';
import {
  listProjects,
  searchProjects,
  createProject,
  deleteProject,
  saveContent,
  listMyProjects,
} from '@/api/scripts';
import { uploadFile } from '@/api/upload';
import { type ScriptTemplate } from '@/components/ScriptTemplates';
import { useAuth } from '@client/src/hooks/useAuth';
import ScriptsPageCreateDialog from './components/ScriptsPageCreateDialog';
import ScriptsPageHeader from './components/ScriptsPageHeader';
import ScriptsPageToolbar from './components/ScriptsPageToolbar';
import ScriptsPageContent from './components/ScriptsPageContent';
import type {
  ScriptProjectItem,
  CreateScriptProjectRequest,
} from '@shared/script.interface';

const SORT_OPTIONS = [
  { value: 'updated', label: '最近更新' },
  { value: 'title', label: '按名称' },
];

const TYPE_LABELS: Record<string, string> = {
  悬疑: '悬疑',
  科幻: '科幻',
  爱情: '爱情',
  惊悚: '惊悚',
  喜剧: '喜剧',
  其他: '其他',
};

const ScriptsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ScriptProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('updated');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [ownedScriptIds, setOwnedScriptIds] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(0);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);
  const [formData, setFormData] = useState<CreateScriptProjectRequest>({
    title: '',
    type: 'film',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScriptProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [titleError, setTitleError] = useState('');

  // Cover upload state
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Track latest request to prevent stale responses
  const requestIdRef = useRef(0);

  const loadOwnedScriptIds = useCallback(async () => {
    if (!user?.userId) {
      setOwnedScriptIds(new Set());
      return;
    }

    try {
      const pageSizeForOwner = 200;
      const first = await listMyProjects({ page: 1, pageSize: pageSizeForOwner });
      const next = new Set(first.items.map((item) => item.id));

      if (first.total > first.items.length) {
        const totalPages = Math.ceil(first.total / pageSizeForOwner);
        for (let p = 2; p <= totalPages; p += 1) {
          const pageRes = await listMyProjects({ page: p, pageSize: pageSizeForOwner });
          pageRes.items.forEach((item) => {
            next.add(item.id);
          });
        }
      }

      setOwnedScriptIds(next);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('获取我的剧本列表失败:', msg);
      setOwnedScriptIds(new Set());
    }
  }, [user?.userId]);

  useEffect(() => {
    loadOwnedScriptIds();
  }, [loadOwnedScriptIds]);

  const fetchProjects = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setFetchError('');
    try {
      if (keyword.trim()) {
        const res = await searchProjects({ keyword: keyword.trim(), page, pageSize });
        // 忽略过期响应
        if (requestId !== requestIdRef.current) return;
        setProjects(res.items as unknown as ScriptProjectItem[]);
        setTotal(res.total);
      } else {
        const res = await listProjects({ sort, page, pageSize });
        if (requestId !== requestIdRef.current) return;
        setProjects(res.items);
        setTotal(res.total);
      }
    } catch (err: unknown) {
      if (requestId === requestIdRef.current) {
        logger.error('Failed to fetch projects:', err);
        setFetchError('加载剧本项目失败，请检查网络后重试');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [sort, keyword, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handleSortToggle = () => {
    setSort((prev) => (prev === 'updated' ? 'title' : 'updated'));
    setPage(1);
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);
    try {
      const result = await uploadFile(file);
      setFormData((f) => ({ ...f, cover_url: result.url }));
    } catch (err: unknown) {
      logger.error('Failed to upload cover:', err);
      toast.error('封面上传失败，请重试');
      setCoverPreview('');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = (): void => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview('');
    setFormData((f) => {
      const next = { ...f };
      delete next.cover_url;
      return next;
    });
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setTitleError('请输入项目名称');
      return;
    }
    setTitleError('');
    setCreating(true);
    try {
      const res = await createProject(formData);
      // If using template, save template content
      if (useTemplate && selectedTemplate) {
        try {
          await saveContent(res.id, {
            content: selectedTemplate.content,
            snapshot_summary: `从模板「${selectedTemplate.label}」创建`,
          });
        } catch (err: unknown) {
          logger.error('Failed to save template content:', err);
        }
      }
      setDialogOpen(false);
      setDialogStep(0);
      setUseTemplate(false);
      setSelectedTemplate(null);
      setFormData({ title: '', type: 'film', description: '' });
      handleRemoveCover();
      navigate(`/scripts/${res.id}`);
    } catch (err: unknown) {
      logger.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
      toast.success('剧本项目已删除');
    } catch (err: unknown) {
      logger.error('Failed to delete project:', err);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openCreateDialog = () => {
    setDialogStep(0);
    setUseTemplate(false);
    setSelectedTemplate(null);
    setFormData({ title: '', type: 'film', description: '' });
    handleRemoveCover();
    setDialogOpen(true);
  };

  const nextStep = () => {
    if (dialogStep === 0) {
      if (!formData.title.trim()) {
        setTitleError('请输入项目名称');
        return;
      }
      setTitleError('');
      if (!formData.description.trim()) {
        setFormData((f) => ({ ...f, description: '暂无描述' }));
      }
    }
    setDialogStep((s) => s + 1);
  };

  const prevStep = () => setDialogStep((s) => s - 1);

  const canDeleteProject = (project: ScriptProjectItem): boolean => {
    if (!user?.userId) return false;
    if (project.creator_id) {
      return project.creator_id === user.userId;
    }
    return ownedScriptIds.has(project.id);
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-[hsl(228_15%_8%)]">
      <div className="app-container-shell">
        <ScriptsPageHeader
          total={total}
          canCreate={!!user}
          onCreate={openCreateDialog}
        />

        <ScriptsPageToolbar
          keyword={keyword}
          onKeywordChange={handleSearch}
          onSortToggle={handleSortToggle}
          sortLabel={SORT_OPTIONS.find((option) => option.value === sort)?.label || '排序'}
        />

        <ScriptsPageContent
          fetchError={fetchError}
          loading={loading}
          projects={projects}
          onRetry={fetchProjects}
          onOpen={(projectId) => navigate(`/scripts/${projectId}`)}
          onDelete={(target) => setDeleteTarget(target)}
          canDelete={canDeleteProject}
          typeLabel={(type) => TYPE_LABELS[type] || type}
          formatTime={formatTime}
        />
      </div>

      <ScriptsPageCreateDialog
        open={dialogOpen}
        dialogStep={dialogStep}
        useTemplate={useTemplate}
        selectedTemplate={selectedTemplate}
        formData={formData}
        titleError={titleError}
        setTitleError={setTitleError}
        creating={creating}
        coverPreview={coverPreview}
        coverUploading={coverUploading}
        onOpenChange={setDialogOpen}
        setUseTemplate={setUseTemplate}
        setDialogStep={setDialogStep}
        setSelectedTemplate={setSelectedTemplate}
        setFormData={setFormData}
        onNextStep={nextStep}
        onPrevStep={prevStep}
        onCreate={handleCreate}
        onCoverSelect={handleCoverSelect}
        onRemoveCover={handleRemoveCover}
        coverInputRef={coverInputRef}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="bg-[hsl(228_14%_12%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription className="text-[hsl(220_10%_55%)]">
              确定要删除剧本项目「{deleteTarget?.title}」吗？此操作不可撤销，相关内容和评论也将一并删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)]"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptsPage;
