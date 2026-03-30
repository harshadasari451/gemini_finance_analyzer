import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Image, Sparkles } from 'lucide-react';

const icons = [
  { Icon: FileText, key: 'file' },
  { Icon: Upload, key: 'upload' },
  { Icon: Image, key: 'image' },
  { Icon: Sparkles, key: 'sparkles' },
];

export function AnimatedIcon() {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const { Icon, key } = icons[currentIconIndex];

  return (
    <div className="relative w-10 h-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-10 h-10 text-blue-400" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
