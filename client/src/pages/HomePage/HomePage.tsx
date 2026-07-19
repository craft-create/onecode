/**
 * 首页组件
 * 功能：光影工坊平台首页，展示平台核心内容
 * 页面结构（从上到下）：
 *   1. 精选素材轮播（顶部大图）
 *   2. 平台数据统计栏（素材数/剧本数/创作者数）
 *   3. 热门影音素材板块（5列卡片网格）
 *   4. 热门剧本板块（4列卡片网格）
 *   5. 优秀创作者板块
 * 数据加载：并行请求四个接口，有加载态和错误态
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';
// UI骨架屏组件，加载时显示
import { Skeleton } from '@client/src/components/ui/skeleton';
// 首页各板块组件
import FeaturedCarousel from '@client/src/components/home/FeaturedCarousel';
import PopularScripts from '@client/src/components/home/PopularScripts';
import PopularMaterials from '@client/src/components/home/PopularMaterials';
import TopCreators from '@client/src/components/home/TopCreators';
import StatisticsBar from '@client/src/components/home/StatisticsBar';
// 首页API接口
import {
  getFeaturedMaterials,
  getPopularScripts,
  getTopCreators,
  getStatistics,
} from '@client/src/api/home';
// 类型定义
import type {
  FeaturedMaterial,
  PopularScript,
  TopCreator,
  PlatformStatistics,
} from '@shared/home.interface';
import { PageFrame, PageHeader } from '../shared/PageShell';
import { PageErrorState } from '../shared/PageStatePanel';

/**
 * 首页主组件
 * 负责数据获取、状态管理和页面布局
 */
const HomePage: React.FC = () => {
  // 路由导航
  const navigate = useNavigate();

  // ===== 状态定义 =====
  // 精选素材数据（轮播 + 热门素材共用）
  const [featured, setFeatured] = useState<FeaturedMaterial[]>([]);
  // 热门剧本数据
  const [scripts, setScripts] = useState<PopularScript[]>([]);
  // 优秀创作者数据
  const [creators, setCreators] = useState<TopCreator[]>([]);
  // 平台统计数据
  const [stats, setStats] = useState<PlatformStatistics | null>(null);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  // 错误信息
  const [error, setError] = useState<string>('');

  /**
   * 获取首页所有数据
   * 使用Promise.all并行请求四个接口，提升加载速度
   * useCallback包裹避免不必要的重渲染
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 并行请求四个接口
      const [
        featuredRes,
        scriptsRes,
        creatorsRes,
        statsRes,
      ] = await Promise.all([
        getFeaturedMaterials(),
        getPopularScripts(),
        getTopCreators(),
        getStatistics(),
      ]);
      // 更新各状态
      setFeatured(featuredRes.items);
      setScripts(scriptsRes.items);
      setCreators(creatorsRes.items);
      setStats(statsRes);
    } catch (err: unknown) {
      // 错误处理：记录日志 + 显示用户友好提示
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to load homepage data: ${msg}`);
      setError('加载首页数据失败，请检查网络后重试');
    } finally {
      // 无论成功失败都关闭加载态
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== 加载状态：显示骨架屏 =====
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container-shell space-y-10">
          {/* 轮播骨架 */}
          <Skeleton className="w-full aspect-[21/9] rounded-xl" />
          {/* 统计栏骨架（3个卡片） */}
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          {/* 热门剧本骨架（4个卡片） */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_: unknown, i: number) => (
              <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== 错误状态：显示错误提示 + 重试按钮 =====
  if (error) {
    return (
      <PageErrorState message={error} onRetry={fetchData} />
    );
  }

  // 默认统计数据（空值兜底）
  const defaultStats: PlatformStatistics = {
    material_count: 0,
    script_count: 0,
    creator_count: 0,
  };

  // ===== 正常渲染：首页完整内容 =====
  return (
    <PageFrame
      className="min-h-screen bg-background"
      containerClassName="app-container-shell space-y-12"
      contentClassName="space-y-10 pb-8"
    >
      <PageHeader title="光影工坊" />
      {/* 板块1：精选素材轮播 */}
      <section className="space-y-4">
        {featured.length > 0 ? (
          <FeaturedCarousel items={featured} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">暂无精选素材</p>
          </div>
        )}
      </section>

      {/* 板块2：平台数据统计栏 */}
      <section data-ai-section-type="card-stat" className="space-y-4">
        <StatisticsBar stats={stats ?? defaultStats} />
      </section>

      {/* 板块3：热门影音素材（新增） */}
      <section className="space-y-5 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">热门影音素材</h2>
          {/* 查看全部按钮，跳转到素材库列表页 */}
          <button
            onClick={() => navigate('/materials')}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            查看全部 →
          </button>
        </div>
        {featured.length > 0 ? (
          <PopularMaterials items={featured} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">暂无热门素材</p>
          </div>
        )}
      </section>

      {/* 板块4：热门剧本 */}
      <section className="space-y-5 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">热门剧本</h2>
        </div>
        {scripts.length > 0 ? (
          <PopularScripts items={scripts} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">暂无热门剧本</p>
          </div>
        )}
      </section>

      {/* 板块5：优秀创作者 */}
      <section className="space-y-5 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">优秀创作者</h2>
        </div>
        {creators.length > 0 ? (
          <TopCreators items={creators} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">暂无优秀创作者</p>
          </div>
        )}
      </section>
    </PageFrame>
  );
};

export default HomePage;
