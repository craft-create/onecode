import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import type { FeaturedMaterial } from '@shared/home.interface';

interface FeaturedCarouselProps {
  items: FeaturedMaterial[];
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items }) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev: number) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((prev: number) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (isPaused || items.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next, items.length]);

  if (items.length === 0) {
    return (
      <div className="w-full aspect-[21/9] rounded-xl bg-card flex items-center justify-center">
        <p className="text-muted-foreground text-sm">暂无精选素材</p>
      </div>
    );
  }

  const item = items[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="aspect-[21/9] relative bg-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Link to={`/materials/${item.id}`} className="block w-full h-full">
              {item.cover_url ? (
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent to-card" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-2xl font-bold text-white mb-2 font-['Space_Grotesk']">
                  {item.title}
                </h2>
                <p className="text-sm text-white/70 line-clamp-2 max-w-2xl">
                  {item.description}
                </p>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — visible on hover */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
        aria-label="上一张"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
        aria-label="下一张"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_: FeaturedMaterial, index: number) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? 'bg-white w-6'
                : 'bg-white/40 hover:bg-white/60 w-2'
            }`}
            aria-label={`第 ${index + 1} 张`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
