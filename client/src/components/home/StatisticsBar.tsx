import { useState } from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { Film, Clapperboard, Users } from 'lucide-react';
import type { PlatformStatistics } from '@shared/home.interface';

interface StatisticsBarProps {
  stats: PlatformStatistics | null;
}

interface StatItemConfig {
  key: keyof PlatformStatistics;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const statItems: StatItemConfig[] = [
  { key: 'material_count', label: '素材总量', icon: Film },
  { key: 'script_count', label: '剧本数', icon: Clapperboard },
  { key: 'creator_count', label: '创作者', icon: Users },
];

const StatisticsBar: React.FC<StatisticsBarProps> = ({ stats }) => {
  const [inView, setInView] = useState(false);

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true }}
      className="grid grid-cols-3 gap-4"
    >
      {statItems.map(({ key, label, icon: Icon }: StatItemConfig) => (
        <div
          key={key}
          className="bg-card rounded-xl border border-border p-6 flex flex-col items-center gap-2"
        >
          <Icon className="w-6 h-6 text-primary" />
          <div className="text-3xl font-bold text-foreground tabular-nums">
            {inView && stats ? (
              <CountUp
                end={stats[key]}
                duration={2}
                separator=","
                useEasing
              />
            ) : (
              <span>0</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      ))}
    </motion.div>
  );
};

export default StatisticsBar;
