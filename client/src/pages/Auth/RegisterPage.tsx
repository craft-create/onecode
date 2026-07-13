/**
 * 注册页面
 * 功能：用户输入昵称、密码、确认密码进行注册
 * 注册成功后自动登录并跳转首页
 * 暗色主题风格，使用项目已有的UI组件
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logger } from '@/compat/client-toolkit/logger';
import { Film, Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { PageFrame } from '../shared/PageShell';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { register, login } from '@client/src/api/auth';
import { useAuth } from '@client/src/hooks/useAuth';

/**
 * 注册页面主组件
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // ===== 表单状态 =====
  const [nickname, setNickname] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 错误信息
  const [error, setError] = useState<string>('');

  /**
   * 表单提交处理
   * 调用register API，成功后自动登录并跳转首页
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 基础校验
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      // 先注册
      await register(nickname.trim(), password);
      logger.info('注册成功，正在自动登录');
      // 注册成功后自动登录
      const loginData = await login(nickname.trim(), password);
      localStorage.setItem('token', loginData.token);
      await refreshUser();
      logger.info('自动登录成功');
      navigate('/');
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      logger.error(`注册失败: ${msg}`);
      setError(msg || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame
      className="min-h-screen bg-background flex items-center justify-center"
      containerClassName="w-full flex justify-center px-4"
      contentClassName="w-full max-w-md"
    >
      {/* 背景装饰光斑 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
        <CardHeader className="text-center space-y-3">
          {/* Logo */}
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">创建账号</CardTitle>
          <CardDescription>注册光影工坊，开启你的创作之旅</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* 昵称输入 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNickname(e.target.value)
                }
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {/* 确认密码输入 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {/* 注册按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>

            {/* 登录链接 */}
            <p className="text-sm text-muted-foreground">
              已有账号？{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                立即登录
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </PageFrame>
  );
};

export default RegisterPage;
