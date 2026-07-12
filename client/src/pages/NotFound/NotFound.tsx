import { Link } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';

const NotFound = () => {
  return (
    <PageShell className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md px-6 text-center">
        <p className="text-6xl font-bold text-foreground">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          页面不存在
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          你访问的页面找不到了，可能已被移除或地址有误。
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          返回首页
        </Link>
      </div>
    </PageShell>
  );
};

export default NotFound;
