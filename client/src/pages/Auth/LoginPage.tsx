/**
 * 登录页面
 * 功能：用户输入昵称和密码进行登录
 * 登录成功后跳转到首页
 * 暗色主题风格，使用项目已有的UI组件
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logger } from '@client/compat/client-toolkit/logger';
import { Film, Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { login } from '@client/src/api/auth';
import { useAuth } from '@client/src/hooks/useAuth';

/**
 * 登录页面主组件
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // ===== 表单状态 =====
  const [nickname, setNickname] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 错误信息
  const [error, setError] = useState<string>('');

  /**
   * 表单提交处理
   * 调用login API，成功后跳转首页
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

    setLoading(true);
    try {
      const result = await login(nickname.trim(), password);
      localStorage.setItem('token', result.token);
      await refreshUser();
      logger.info('登录成功');
      navigate('/');
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      logger.error(`登录失败: ${msg}`);
      setError(msg || '登录失败，请检查昵称和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* 背景装饰光斑 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
        <CardHeader className="text-center space-y-3">
          {/* Logo */}
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
          <CardDescription>登录光影工坊，继续你的创作之旅</CardDescription>
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
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>

            {/* 注册链接 */}
            <p className="text-sm text-muted-foreground">
              还没有账号？{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                立即注册
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
