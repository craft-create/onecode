import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FC } from 'react';
import { type PasswordFormData } from './types';

interface PasswordSectionProps {
  passwordData: PasswordFormData;
  passwordChanging: boolean;
  onPasswordChange: (field: keyof PasswordFormData, value: string) => void;
  onChangePassword: () => void;
}

export const PasswordSection: FC<PasswordSectionProps> = ({
  passwordData,
  passwordChanging,
  onPasswordChange,
  onChangePassword,
}) => {
  return (
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
              onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
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
              onChange={(e) => onPasswordChange('newPassword', e.target.value)}
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
              onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
              className="pl-10"
              placeholder="再次输入新密码"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onChangePassword} disabled={passwordChanging}>
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
  );
};
