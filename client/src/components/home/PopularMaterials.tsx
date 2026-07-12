/**
 * 热门影音素材展示组件
 * 功能：在首页展示热门影音素材卡片网格
 * 布局：5列响应式网格（大屏5列、中屏4列、小屏2列）
 * 交互：悬停放大 + 播放按钮浮现，点击跳转到素材详情页
 */
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { FeaturedMaterial } from '@shared/home.interface';

/**
 * 热门素材组件属性定义
 * @param items - 素材数据数组（与其他首页组件保持一致的命名）
 */
interface PopularMaterialsProps {
  items: FeaturedMaterial[];
}

/**
 * 热门影音素材展示组件
 * 以卡片网格形式展示热门素材，支持悬停动效
 */
export default function PopularMaterials({ items }: PopularMaterialsProps) {
  // 路由导航hook，用于点击卡片跳转到详情页
  const navigate = useNavigate();

  // 空状态：没有素材时显示提示
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无热门素材
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {/* 遍历素材数组渲染卡片 */}
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          // 入场动画：从下方淡入，依次延迟出现
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          // 悬停放大效果
          whileHover={{ scale: 1.03 }}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-card shadow-sm hover:shadow-lg transition-shadow"
          // 点击跳转到素材详情页
          onClick={() => navigate(`/materials/${item.id}`)}
        >
          {/* 封面图区域 */}
          <div className="aspect-video relative overflow-hidden bg-muted">
            {/* 有封面图则显示，否则显示播放图标占位 */}
            {item.cover_url ? (
              <img
                src={item.cover_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                <Play className="w-10 h-10" />
              </div>
            )}

            {/* 悬停时浮现的播放按钮遮罩 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <Play
                className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                fill="white"
              />
            </div>
          </div>

          {/* 素材标题 */}
          <div className="p-3">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
