/**
 * 个人中心页面
 * 展示当前登录用户的信息、上传的素材和创建的剧本
 * 支持编辑和删除操作
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  FileText,
  Trash2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Upload,
  PenLine,
  Loader2,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@client/src/components/ui/image';
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
import { getMe, uploadAvatar } from '@client/src/api/auth';
import type { CurrentUser } from '@client/src/api/auth';
import { getUserUploads } from '@client/src/api/user-materials';
import { listMyProjects, deleteProject } from '@client/src/api/scripts';
import { deleteMaterial } from '@client/src/api/materials';
import type { UserMaterialItem } from '@shared/material.interface';
import type { ScriptProjectItem } from '@shared/script.interface';

type TabKey = 'materials' | 'scripts';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'materials', label: '我的素材', icon: <Film className="w-4 h-4" /> },
  { key: 'scripts', label: '我的剧本', icon: <FileText className="w-4 h-4" /> },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('materials');

  // 素材相关状态
  const [materials, setMaterials] = useState<UserMaterialItem[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');

  // 剧本相关状态
  const [scripts, setScripts] = useState<ScriptProjectItem[]>([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError, setScriptsError] = useState('');

  // 删除对话框状态
  const [deleteTarget, setDeleteTarget] = useState<{ type: TabKey; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 头像上传相关状态
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /**
   * 获取当前用户信息
   * 未登录时跳转到登录页
   */
  const fetchUser = useCallback(async () => {
    try {
      const user: CurrentUser | null = await getMe();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);
      setAuthChecked(true);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      logger.error(`获取用户信息失败: ${msg}`);
      navigate('/login');
    }
  }, [navigate]);

  /**
   * 获取我的素材列表
   */
  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    setMaterialsError('');
    try {
      const res = await getUserUploads({ pageSize: 50 });
      setMaterials(res.items || []);
    } catch (err: unknown) {
      logger.error('加载我的素材失败:', err);
      setMaterialsError('加载素材失败，请检查网络后重试');
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  /**
   * 获取我的剧本列表
   */
  const fetchScripts = useCallback(async () => {
    setScriptsLoading(true);
    setScriptsError('');
    try {
      const res = await listMyProjects({ pageSize: 50 });
      setScripts(res.items || []);
    } catch (err: unknown) {
      logger.error('加载我的剧本失败:', err);
      setScriptsError('加载剧本失败，请检查网络后重试');
    } finally {
      setScriptsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 认证通过后才加载数据
  useEffect(() => {
    if (authChecked) {
      fetchMaterials();
      fetchScripts();
    }
  }, [authChecked, fetchMaterials, fetchScripts]);

  /**
   * 处理删除操作
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'materials') {
        // 素材删除需要通过 material_id
        const item = materials.find((m) => m.id === deleteTarget.id);
        if (item) {
          await deleteMaterial(item.material_id);
          setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        }
      } else {
        await deleteProject(deleteTarget.id);
        setScripts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      }
      toast.success('删除成功');
    } catch (err: unknown) {
      logger.error('删除失败:', err);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /**
   * 处理头像上传
   */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('头像大小不能超过 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(file);
      setCurrentUser((prev) => prev ? { ...prev, avatarUrl: res.avatarUrl } : prev);
      toast.success('头像更新成功');
    } catch (err: unknown) {
      logger.error('头像上传失败:', err);
      toast.error('头像上传失败，请重试');
    } finally {
      setAvatarUploading(false);
      // 清空 input 以便重复选择同一文件
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  /**
   * 格式化日期
   */
  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 未登录 / 正在检查认证 → 显示全屏 loading
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container-shell">
        {/* ===== 用户信息区 ===== */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-5">
            {/* 头像 */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="group/avatar relative w-16 h-16 rounded-full overflow-hidden ring-1 ring-inset ring-primary/20 bg-primary/10 flex items-center justify-center transition-all hover:ring-primary/40"
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={`${currentUser.nickname}的头像`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary select-none">
                    {currentUser?.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
                {/* Hover 遮罩 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                  {avatarUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground font-['Space_Grotesk'] truncate">
                {currentUser?.nickname || '未登录'}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  影视创作者
                </span>
                <span className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  {materials.length} 个素材
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {scripts.length} 个剧本
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Tab 切换 ===== */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ===== Tab 内容 ===== */}
        <AnimatePresence mode="wait">
          {/* 我的素材 */}
          {activeTab === 'materials' && (
            <motion.div
              key="materials"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {materialsError && !materialsLoading ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                  <p className="text-foreground text-sm mb-4">{materialsError}</p>
                  <button
                    onClick={fetchMaterials}
                    className="app-btn-primary"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重试
                  </button>
                </div>
              ) : materialsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-card animate-pulse h-64" />
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Film className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>还没有上传素材</EmptyTitle>
                    <EmptyDescription>
                      前往素材库上传你的第一个素材，开始创作之旅
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    onClick={() => navigate('/materials/upload')}
                    className="mt-4 app-btn-primary-compact"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    去上传
                  </Button>
                </Empty>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  <AnimatePresence mode="popLayout">
                    {materials.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        layout
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.35, delay: idx * 0.04 }}
                        className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-all duration-300"
                      >
                        <div
                          onClick={() => navigate(`/materials/${item.material_id}`)}
                          className="cursor-pointer"
                        >
                          <div className="aspect-[16/10] bg-accent/30 relative overflow-hidden">
                            {item.cover_url ? (
                              <Image
                                src={item.cover_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="size-10 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-foreground truncate text-sm mb-2">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Calendar className="size-3" />
                              <span>{formatTime(item.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/materials/${item.material_id}`);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'materials', id: item.id, title: item.title });
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 我的剧本 */}
          {activeTab === 'scripts' && (
            <motion.div
              key="scripts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {scriptsError && !scriptsLoading ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                  <p className="text-foreground text-sm mb-4">{scriptsError}</p>
                  <button
                    onClick={fetchScripts}
                    className="app-btn-primary"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重试
                  </button>
                </div>
              ) : scriptsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-card animate-pulse h-56" />
                  ))}
                </div>
              ) : scripts.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>还没有创建剧本</EmptyTitle>
                    <EmptyDescription>
                      前往剧本创作页面创建你的第一个剧本
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    onClick={() => navigate('/scripts')}
                    className="mt-4 app-btn-primary-compact"
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    去创建
                  </Button>
                </Empty>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  <AnimatePresence mode="popLayout">
                    {scripts.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        layout
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.35, delay: idx * 0.04 }}
                        className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-all duration-300"
                      >
                        <div
                          onClick={() => navigate(`/scripts/${item.id}`)}
                          className="cursor-pointer"
                        >
                          <div className="aspect-[16/10] bg-accent/30 relative overflow-hidden">
                            {item.cover_url ? (
                              <img
                                src={item.cover_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="size-10 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-foreground truncate text-sm mb-1">
                              {item.title}
                            </h3>
                            {item.type && (
                              <span className="inline-block text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full mb-2">
                                {item.type}
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Calendar className="size-3" />
                              <span>{formatTime(item.updated_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scripts/${item.id}`);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'scripts', id: item.id, title: item.title });
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== 删除确认对话框 ===== */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              确定要删除{deleteTarget?.type === 'materials' ? '素材' : '剧本'}「{deleteTarget?.title}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="border-border text-muted-foreground"
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

export default ProfilePage;
