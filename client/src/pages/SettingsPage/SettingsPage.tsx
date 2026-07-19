/**
 * 用户设置页面
 * 包含：个人资料编辑、密码修改、存储空间统计
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { settingApi } from '@/api';
import { PageFrame } from '../shared/PageShell';
import { type GenderOption, type PasswordFormData, type ProfileFormData, type StorageStats } from './components/types';
import { PasswordSection } from './components/PasswordSection';
import { ProfileSection } from './components/ProfileSection';
import { StorageSection } from './components/StorageSection';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    nickname: '',
    email: '',
    phone: '',
    bio: '',
    gender: 'prefer_not_to_say',
    birthday: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChanging, setPasswordChanging] = useState(false);

  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const data = await settingApi.getProfile();
      if (!data) {
        throw new Error('未获取到用户资料');
      }
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

  const loadStorageStats = useCallback(async () => {
    if (!user) return;

    setStorageLoading(true);
    try {
      const data = await settingApi.getStorageStats();
      if (!data) {
        throw new Error('未获取到存储统计数据');
      }
      setStorageStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('加载存储统计失败:', err);
      toast.error(`加载失败: ${msg}`);
    } finally {
      setStorageLoading(false);
    }
  }, [user]);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('头像大小不能超过 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const { uploadAvatar } = await import('@/api/auth');
      await uploadAvatar(file);
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

  const handleProfileFieldChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordFieldChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || profileLoading) {
    return (
    <PageFrame
      className="min-h-screen bg-background flex items-center justify-center"
      containerClassName="w-full flex items-center justify-center"
      contentClassName=""
    >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      className="min-h-screen bg-background"
      containerClassName="app-container-shell"
      contentClassName=""
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold text-foreground mb-8">账户设置</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="password">密码安全</TabsTrigger>
            <TabsTrigger value="storage">存储空间</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection
              userAvatarUrl={user?.avatarUrl}
              profileData={profileData}
              avatarUploading={avatarUploading}
              profileSaving={profileSaving}
              onSaveProfile={handleSaveProfile}
              avatarInputRef={avatarInputRef}
              onAvatarUpload={handleAvatarChange}
              onAvatarInputOpen={() => avatarInputRef.current?.click()}
              onFieldChange={handleProfileFieldChange}
            />
          </TabsContent>

          <TabsContent value="password">
            <PasswordSection
              passwordData={passwordData}
              passwordChanging={passwordChanging}
              onPasswordChange={handlePasswordFieldChange}
              onChangePassword={handleChangePassword}
            />
          </TabsContent>

          <TabsContent value="storage">
            <StorageSection storageStats={storageStats} storageLoading={storageLoading} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageFrame>
  );
};

export default SettingsPage;
