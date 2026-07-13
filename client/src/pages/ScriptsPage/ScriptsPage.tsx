import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Clock, Users, Film, ArrowUpDown, Trash2, AlertTriangle, RefreshCw, FileText, Clapperboard, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { logger } from '@/compat/client-toolkit/logger';
import { toast } from 'sonner';
import {
  listProjects,
  searchProjects,
  createProject,
  deleteProject,
  saveContent,
} from '@/api/scripts';
import { uploadFile } from '@/api/upload';
import ScriptTemplates, { type ScriptTemplate } from '@/components/ScriptTemplates';
import { useAuth } from '@client/src/hooks/useAuth';
import type {
  ScriptProjectItem,
  CreateScriptProjectRequest,
} from '@shared/script.interface';

const SORT_OPTIONS = [
  { value: 'updated', label: '最近更新' },
  { value: 'title', label: '按名称' },
];

const TYPE_OPTIONS = [
  { value: '悬疑', label: '悬疑' },
  { value: '科幻', label: '科幻' },
  { value: '爱情', label: '爱情' },
  { value: '惊悚', label: '惊悚' },
  { value: '喜剧', label: '喜剧' },
  { value: '其他', label: '其他' },
];

const TYPE_LABELS: Record<string, string> = {
  悬疑: '悬疑',
  科幻: '科幻',
  爱情: '爱情',
  惊悚: '惊悚',
  喜剧: '喜剧',
  其他: '其他',
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(220_15%_90%)] font-['Space_Grotesk']">
              剧本项目
            </h1>
            <p className="text-[hsl(220_10%_55%)] mt-1 text-sm">
              {total} 个项目
            </p>
          </div>
          {user && (
            <Button
              onClick={openCreateDialog}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-[0_0_20px_-4px_rgba(124_92_255_0.4)]"
            >
              <Plus className="size-4" />
              新建项目
            </Button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[hsl(220_10%_55%)]" />
            <Input
              placeholder="搜索项目名称或描述..."
              value={keyword}
              onChange={handleSearch}
              className="pl-10 bg-[hsl(228_14%_12%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortToggle}
            className="gap-2 border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]"
          >
            <ArrowUpDown className="size-3.5" />
            {SORT_OPTIONS.find((o) => o.value === sort)?.label}
          </Button>
        </div>

        {/* Error State */}
        {fetchError && !loading ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-foreground text-sm mb-4">{fetchError}</p>
            <button
              onClick={fetchProjects}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-[hsl(228_14%_12%)] animate-pulse h-64"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Film className="size-6" />
              </EmptyMedia>
              <EmptyTitle>暂无剧本项目</EmptyTitle>
              <EmptyDescription>
                点击右上角「新建项目」开始创作
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                layout
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                whileHover={{ scale: 1.03 }}
                className="group relative cursor-pointer rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-shadow duration-300"
              >
                <div onClick={() => navigate(`/scripts/${project.id}`)}>
                {/* Cover */}
                <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(228_14%_18%)] to-[hsl(228_14%_8%)] relative overflow-hidden">
                  {project.cover_url ? (
                    <img
                      src={project.cover_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="size-10 text-[hsl(220_10%_30%)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(228_15%_8%)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <motion.div
                    className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  >
                    <p className="text-xs text-[hsl(220_15%_90%)] line-clamp-2">
                      {project.description || '暂无描述'}
                    </p>
                  </motion.div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[hsl(220_15%_90%)] truncate text-sm">
                      {project.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[10px] px-1.5 py-0"
                    >
                      {TYPE_LABELS[project.type] || project.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[hsl(220_10%_55%)]">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {project.collaborator_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTime(project.updated_at)}
                    </span>
                  </div>
                </div>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {user && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(project);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[hsl(228_14%_12%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(220_15%_90%)]">
              新建剧本项目
            </DialogTitle>
            <DialogDescription className="text-[hsl(220_10%_55%)]">
              {dialogStep === 0
                ? '选择创建方式'
                : dialogStep === 1
                  ? useTemplate
                    ? '选择剧本模板'
                    : '步骤 1/2：基本信息'
                  : useTemplate
                    ? '步骤 2/2：项目类型'
                    : '步骤 2/2：项目类型'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`h-1 flex-1 rounded-full ${
                dialogStep >= 0 ? 'bg-primary' : 'bg-[hsl(228_12%_18%)]'
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                dialogStep >= 1 ? 'bg-primary' : 'bg-[hsl(228_12%_18%)]'
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                dialogStep >= 2 ? 'bg-primary' : 'bg-[hsl(228_12%_18%)]'
              }`}
            />
          </div>

          {/* Step 0: Choose creation method */}
          {dialogStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => {
                    setUseTemplate(false);
                    setDialogStep(1);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] hover:border-primary/50 transition-all duration-300"
                >
                  <FileText className="size-8 text-[hsl(220_10%_55%)]" />
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-[hsl(220_15%_90%)]">
                      空白项目
                    </h3>
                    <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5">
                      从空白剧本开始创作
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setUseTemplate(true);
                    setDialogStep(1);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] hover:border-primary/50 transition-all duration-300"
                >
                  <Clapperboard className="size-8 text-[hsl(220_10%_55%)]" />
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-[hsl(220_15%_90%)]">
                      从模板创建
                    </h3>
                    <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5">
                      使用预设剧本模板快速开始
                    </p>
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {/* Step 1: Template selection or Basic info */}
          {dialogStep === 1 && useTemplate && (
            <div className="space-y-4">
              <ScriptTemplates
                onSelect={(tpl: ScriptTemplate) => setSelectedTemplate(tpl)}
                selectedKey={selectedTemplate?.key}
              />
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setDialogStep(0)}
                  className="text-[hsl(220_10%_55%)]"
                >
                  上一步
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedTemplate) return;
                    setFormData((f) => ({
                      ...f,
                      title: selectedTemplate.label,
                      description: selectedTemplate.description,
                    }));
                    setDialogStep(2);
                  }}
                  disabled={!selectedTemplate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  下一步
                </Button>
              </div>
            </div>
          )}

          {dialogStep === 1 && !useTemplate && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[hsl(220_10%_55%)] mb-1.5 block">
                  项目名称
                </label>
                <Input
                  placeholder="输入剧本名称..."
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((f) => ({ ...f, title: e.target.value }));
                    if (e.target.value.trim()) setTitleError('');
                  }}
                  className={`bg-[hsl(228_15%_8%)] text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)] ${
                    titleError
                      ? 'border-destructive ring-1 ring-destructive'
                      : 'border-[hsl(228_12%_18%)]'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                />
                {titleError && (
                  <p className="text-xs text-destructive mt-1">{titleError}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-[hsl(220_10%_55%)] mb-1.5 block">
                  项目描述
                </label>
                <Input
                  placeholder="简要描述剧本内容..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                  className="bg-[hsl(228_15%_8%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!formData.title.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  下一步
                </Button>
              </div>
            </div>
          )}

          {dialogStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[hsl(220_10%_55%)] mb-2 block">
                  项目类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((f) => ({ ...f, type: opt.value }))
                      }
                      className={`px-3 py-2 rounded-md text-sm border transition-all duration-200 ${
                        formData.type === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)] hover:border-[hsl(220_10%_40%)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-[hsl(220_10%_55%)] mb-1.5 block">
                  封面图片
                </label>
                {coverPreview ? (
                  <div className="relative group/cover rounded-lg overflow-hidden border border-[hsl(228_12%_18%)]">
                    <img
                      src={coverPreview}
                      alt="封面预览"
                      className="w-full aspect-[16/10] object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="p-2 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    {coverUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="size-6 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    className="w-full aspect-[16/10] rounded-lg border-2 border-dashed border-[hsl(228_12%_18%)] hover:border-primary/50 bg-[hsl(228_15%_8%)] flex flex-col items-center justify-center gap-2 transition-colors duration-200"
                  >
                    {coverUploading ? (
                      <Loader2 className="size-8 text-primary animate-spin" />
                    ) : (
                      <>
                        <Upload className="size-8 text-[hsl(220_10%_30%)]" />
                        <span className="text-xs text-[hsl(220_10%_55%)]">点击上传封面</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleCoverSelect}
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="text-[hsl(220_10%_55%)]"
                >
                  上一步
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {creating ? '创建中...' : '创建项目'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
