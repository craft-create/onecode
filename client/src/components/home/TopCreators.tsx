import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserDisplay } from '@client/src/components/business-ui/user-display';
import { Film } from 'lucide-react';
import type { TopCreator } from '@shared/home.interface';

interface TopCreatorsProps {
  items: TopCreator[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const TopCreators: React.FC<TopCreatorsProps> = ({ items }) => {
  const navigate = useNavigate();
  const validItems = items.filter((item: TopCreator) => item.id && item.id.trim() !== '');

  if (validItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">暂无创作者数据</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      {validItems.map((item: TopCreator) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          onClick={() => navigate('/materials')}
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center text-center hover:border-primary/30 transition-colors duration-300 cursor-pointer"
        >
          <UserDisplay
            value={item.id
              ? [{
                  user_id: item.id,
                  name: item.name,
                  avatar: item.avatar_url,
                }]
              : []}
            size="large"
            showLabel={true}
          />
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-2 w-full justify-center">
            <Film className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[100px]">
              {item.representative_work || '暂无作品'}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TopCreators;
