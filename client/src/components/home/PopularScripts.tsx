import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Image } from '@client/src/components/ui/image';
import { Badge } from '@client/src/components/ui/badge';
import { UserDisplay } from '@client/src/components/business-ui/user-display';
import { Heart } from 'lucide-react';
import type { PopularScript } from '@shared/home.interface';

interface PopularScriptsProps {
  items: PopularScript[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const PopularScripts: React.FC<PopularScriptsProps> = ({ items }) => {
  const navigate = useNavigate();
  const validItems = items.filter((item: PopularScript) => item.author_name && item.author_name.trim() !== '');

  if (validItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">暂无热门剧本</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {validItems.map((item: PopularScript) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          whileHover={{ y: -4 }}
          onClick={() => navigate(`/scripts/${item.id}`)}
          className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-[0_8px_30px_-8px_rgba(0_0_0_0.4)] transition-shadow duration-300 cursor-pointer"
        >
          <div className="aspect-[16/10] relative overflow-hidden bg-accent/30">
            {item.cover_url ? (
              <Image
                src={item.cover_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/50 to-card flex items-center justify-center">
                <Heart className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            {item.type && (
              <div className="absolute top-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-black/50 backdrop-blur-sm text-white/90 border-0 text-xs"
                >
                  {item.type}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground truncate mb-3">
              {item.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <UserDisplay
                  value={item.author_id
                    ? [{
                        user_id: item.author_id,
                        name: item.author_name,
                        avatar: item.author_avatar_url,
                      }]
                    : []}
                  size="small"
                  showLabel={true}
                />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm shrink-0 ml-2">
                <Heart className="w-3.5 h-3.5" />
                <span>{item.like_count}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PopularScripts;
