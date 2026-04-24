import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineExclamationTriangle, HiOutlineShieldExclamation, HiOutlineSignal } from 'react-icons/hi2';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      label: 'Active Tourists',
      value: stats?.activeTourists || 0,
      total: stats?.totalTourists || 0,
      icon: HiOutlineUsers,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Open Incidents',
      value: stats?.openIncidents || 0,
      total: stats?.totalIncidents || 0,
      icon: HiOutlineExclamationTriangle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      label: 'Critical Alerts',
      value: stats?.criticalIncidents || 0,
      icon: HiOutlineShieldExclamation,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      label: 'Last 24h Incidents',
      value: stats?.incidents24h || 0,
      icon: HiOutlineSignal,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="stat-card group hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl ${card.bgColor} transition-transform group-hover:scale-110`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            {card.total !== undefined && (
              <span className="text-xs text-[var(--text-secondary)]">of {card.total}</span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
