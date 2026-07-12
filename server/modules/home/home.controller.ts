/**
 * 首页模块控制器
 * 功能：定义首页数据接口
 * 基础路径：/api/home
 *
 * 接口清单：
 * GET /featured-materials  精选素材（轮播）
 * GET /popular-scripts     热门剧本
 * GET /top-creators        优秀创作者
 * GET /statistics          平台统计数据
 */
import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import type {
  FeaturedMaterial,
  HomeListResponse,
  PopularScript,
  TopCreator,
  PlatformStatistics,
} from '@shared/home.interface';

@Controller('api/home')
export class HomeController {
  /**
   * 构造函数：注入首页服务
   */
  constructor(private readonly homeService: HomeService) {}

  /**
   * GET /api/home/featured-materials - 获取精选素材
   * 用于首页顶部大图轮播展示
   * @returns 精选素材数组包装
   */
  @Get('featured-materials')
  async getFeaturedMaterials(): Promise<HomeListResponse<FeaturedMaterial>> {
    return { items: await this.homeService.getFeaturedMaterials() };
  }

  /**
   * GET /api/home/popular-scripts - 获取热门剧本
   * 用于首页热门剧本板块展示
   * @returns 热门剧本数组包装
   */
  @Get('popular-scripts')
  async getPopularScripts(): Promise<HomeListResponse<PopularScript>> {
    return { items: await this.homeService.getPopularScripts() };
  }

  /**
   * GET /api/home/top-creators - 获取优秀创作者
   * 用于首页创作者排行榜展示
   * @returns 创作者数组包装
   */
  @Get('top-creators')
  async getTopCreators(): Promise<HomeListResponse<TopCreator>> {
    return { items: await this.homeService.getTopCreators() };
  }

  /**
   * GET /api/home/statistics - 获取平台统计数据
   * 用于首页数据统计栏展示（素材数、剧本数、创作者数）
   * @returns 三项统计数据
   */
  @Get('statistics')
  async getStatistics(): Promise<PlatformStatistics> {
    return this.homeService.getStatistics();
  }
}
