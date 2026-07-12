import { Loader2, Camera, User, Mail, Phone, FileText, Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image } from '@/components/ui/image';
import type { FC } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import { USER_GENDER_OPTIONS, type GenderOption, type ProfileFormData } from './types';

interface ProfileSectionProps {
  userAvatarUrl?: string | null;
  profileData: ProfileFormData;
  avatarUploading: boolean;
  profileSaving: boolean;
  onSaveProfile: () => void;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  onAvatarUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onAvatarInputOpen: () => void;
  onFieldChange: (field: keyof ProfileFormData, value: string) => void;
}

export const ProfileSection: FC<ProfileSectionProps> = ({
  userAvatarUrl,
  profileData,
  avatarUploading,
  profileSaving,
  avatarInputRef,
  onAvatarUpload,
  onAvatarInputOpen,
  onFieldChange,
  onSaveProfile,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>个人资料</CardTitle>
        <CardDescription>管理你的个人信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/20">
              {userAvatarUrl ? (
                <Image src={userAvatarUrl} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onAvatarInputOpen}
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
              onChange={onAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">点击相机图标上传新头像</p>
            <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG、GIF，最大 5MB</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nickname">昵称</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="nickname"
                value={profileData.nickname}
                onChange={(e) => onFieldChange('nickname', e.target.value)}
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
                onChange={(e) => onFieldChange('email', e.target.value)}
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
                onChange={(e) => onFieldChange('phone', e.target.value)}
                className="pl-10"
                placeholder="13800138000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gender">性别</Label>
            <Select
              value={profileData.gender}
              onValueChange={(value) => onFieldChange('gender', value as GenderOption)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择性别" />
              </SelectTrigger>
              <SelectContent>
                {USER_GENDER_OPTIONS.map((opt) => (
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
                onChange={(e) => onFieldChange('birthday', e.target.value)}
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
                onChange={(e) => onFieldChange('bio', e.target.value)}
                className="pl-10 min-h-[100px]"
                placeholder="介绍一下自己..."
                maxLength={500}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{profileData.bio.length}/500</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSaveProfile} disabled={profileSaving}>
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
  );
};
