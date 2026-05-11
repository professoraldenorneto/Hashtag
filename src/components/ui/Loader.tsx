import { Hash } from 'lucide-react';
import { motion } from 'motion/react';

export default function Loader({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="text-indigo-600"
      >
        <Hash size={48} />
      </motion.div>
      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
        Carregando...
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {content}
      </div>
    );
  }

  return content;
}
