import { motion } from 'framer-motion';
import { HiSun, HiMoon } from 'react-icons/hi2';
import useThemeStore from '../../stores/themeStore';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <HiSun className="w-5 h-5 text-yellow-400" />
        ) : (
          <HiMoon className="w-5 h-5 text-slate-600" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
