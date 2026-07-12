import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const THRESHOLD = 300;

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > THRESHOLD);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-8 right-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg hover:scale-110 hover:shadow-xl transition-transform duration-200"
          aria-label="滚动到顶部"
        >
          <ArrowUp className="h-5 w-5 text-foreground" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
