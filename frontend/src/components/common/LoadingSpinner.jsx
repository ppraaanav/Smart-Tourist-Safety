import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-4 border-primary-200 dark:border-slate-600 border-t-primary-500`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm text-[var(--text-secondary)] animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
