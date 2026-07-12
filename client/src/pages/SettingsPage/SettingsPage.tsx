/**
 * 用户设置页面
 * 包含：个人资料编辑、密码修改、存储空间统计
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Lock,
  HardDrive,
  Save,
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { logger } from '@client/compat/client-toolkit/logger';
import { useAuth } from '@/hooks/useAuth';
import { settingApi } from '@/api';
import type { UserProfileData } from '@/api';
import { PageShell } from '../shared/PageShell';

type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not_to_say', label: '不愿透露' },
];

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // ========== Profile Tab ==========
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState<{
    nickname: string;
    email: string;
    phone: string;
    bio: string;
    gender: GenderOption;
    birthday: string;
  }>({
    nickname: '',
    email: '',
    phone: '',
    bio: '',
    gender: 'prefer_not_to_say',
    birthday: '',
  });

  // ========== Password Tab ==========
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChanging, setPasswordChanging] = useState(false);

  // ========== Storage Tab ==========
  const [storageStats, setStorageStats] = useState<{
    used: number;
    quota: number;
    remaining: number;
    usagePercent: number;
    formattedUsed: string;
    formattedQuota: string;
    formattedRemaining: string;
  } | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  // ========== Avatar ==========
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /**
   * 加载用户资料
   */
  const loadProfile = useCallback(async () => {
    if (!user?.userId) return;

    setProfileLoading(true);
    try {
      const data = await settingApi.getProfile();
      setProfileData({
        nickname: data.nickname || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        gender: (data.gender as GenderOption) || 'prefer_not_to_say',
        birthday: data.birthday ? data.birthday.split('T')[0] : '',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('加载用户资料失败:', err);
      toast.error(`加载失败: ${msg}`);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  /**
   * 加载存储统计
   */
  const loadStorageStats = useCallback(async () => {
    if (!user?.userId) return;

    setStorageLoading(true);
    try {
      const data = await settingApi.getStorageStats();
      setStorageStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('加载存储统计失败:', err);
      toast.error(`加载失败: ${msg}`);
    } finally {
      setStorageLoading(false);
    }
  }, [user]);

  // 初始加载
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadProfile();
      loadStorageStats();
    }
  }, [user, authLoading, navigate, loadProfile, loadStorageStats]);

  /**
   * 保存个人资料
   */
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await settingApi.updateProfile(profileData);
      toast.success('个人资料已更新');
      await refreshUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('保存个人资料失败:', err);
      toast.error(`保存失败: ${msg}`);
    } finally {
      setProfileSaving(false);
    }
  };

  /**
   * 修改密码
   */
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }

    setPasswordChanging(true);
    try {
      await settingApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('密码已修改');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('修改密码失败:', err);
      toast.error(`修改失败: ${msg}`);
    } finally {
      setPasswordChanging(false);
    }
  };

  /**
   * 头像上传
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
      const formData = new FormData();
      formData.append('file', file);
      const { uploadAvatar } = await import('@/api/auth');
      const res = await uploadAvatar(file);
      toast.success('头像更新成功');
      await refreshUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('头像上传失败:', err);
      toast.error(`上传失败: ${msg}`);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  if (authLoading) {
    return (
      <PageShell className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-8">账户设置</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="profile">个人资料</TabsTrigger>
              <TabsTrigger value="password">密码安全</TabsTrigger>
              <TabsTrigger value="storage">存储空间</TabsTrigger>
            </TabsList>

            {/* ===== 个人资料 ===== */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>个人资料</CardTitle>
                  <CardDescription>管理你的个人信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 头像 */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/20">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="头像" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">点击相机图标上传新头像</p>
                      <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG、GIF，最大 5MB</p>
                    </div>
                  </div>

                  {/* 表单字段 */}
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nickname">昵称</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="nickname"
                          value={profileData.nickname}
                          onChange={(e) => setProfileData({ ...profileData, nickname: e.target.value })}
                          className="pl-10"
                          placeholder="你的昵称"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">邮箱</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="pl-10"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone">手机号</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="pl-10"
                          placeholder="13800138000"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="gender">性别</Label>
                      <Select
                        value={profileData.gender}
                        onValueChange={(value) => setProfileData({ ...profileData, gender: value as GenderOption })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择性别" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="birthday">生日</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="birthday"
                          type="date"
                          value={profileData.birthday}
                          onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">个人简介</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          className="pl-10 min-h-[100px]"
                          placeholder="介绍一下自己..."
                          maxLength={500}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{profileData.bio.length}/500</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={profileSaving}>
                      {profileSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== 密码安全 ===== */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>修改密码</CardTitle>
                  <CardDescription>定期修改密码可以保护你的账户安全</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="pl-10"
                        placeholder="输入当前密码"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="pl-10"
                        placeholder="至少6位字符"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="pl-10"
                        placeholder="再次输入新密码"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleChangePassword} disabled={passwordChanging}>
                      {passwordChanging ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          修改中...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          修改密码
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== 存储空间 ===== */}
            <TabsContent value="storage">
              <Card>
                <CardHeader>
                  <CardTitle>存储空间</CardTitle>
                  <CardDescription>查看和管理你的存储空间使用情况</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {storageStats && (
                    <>
                      {/* 存储使用进度条 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">已使用空间</span>
                          <span className="font-medium">
                            {storageStats.formattedUsed} / {storageStats.formattedQuota}
                          </span>
                        </div>
                        <div className="h-3 bg-accent rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${storageStats.usagePercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full ${
                              storageStats.usagePercent > 90
                                ? 'bg-destructive'
                                : storageStats.usagePercent > 70
                                ? 'bg-yellow-500'
                                : 'bg-primary'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          剩余 {storageStats.formattedRemaining}
                        </p>
                      </div>

                      {/* 存储统计卡片 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-accent/50">
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">已使用</span>
                          </div>
                          <p className="text-2xl font-bold">{storageStats.formattedUsed}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent/50">
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">总配额</span>
                          </div>
                          <p className="text-2xl font-bold">{storageStats.formattedQuota}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent/50">
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">剩余</span>
                          </div>
                          <p className="text-2xl font-bold">{storageStats.formattedRemaining}</p>
                        </div>
                      </div>

                      {/* 使用率警告 */}
                      {storageStats.usagePercent > 90 && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">存储空间不足</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              你的存储空间已使用超过 90%，建议清理不需要的文件或升级存储空间。
                            </p>
                          </div>
                        </div>
                      )}

                      {storageStats.usagePercent > 70 && storageStats.usagePercent <= 90 && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-600">存储空间提醒</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              你的存储空间已使用超过 70%，请注意空间使用情况。
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {storageLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default SettingsPage;
