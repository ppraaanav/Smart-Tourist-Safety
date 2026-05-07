import useSocket from '../../hooks/useSocket';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi2';
import { alertAPI } from '../../services/api';
import { timeAgo } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

const AlertsList = () => {
  const [alerts, setAlerts] = useState([]);
  useSocket('alert:new', (newAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const res = await alertAPI.getAll({ limit: 50 });
      setAlerts(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const markRead = async (id) => {
    await alertAPI.markAsRead(id);
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    setUnreadCount(prev => Math.max(prev - 1, 0));
  };

  const markAllRead = async () => {
    await alertAPI.markAllAsRead();
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    setUnreadCount(0);
  };

  if (loading) return <LoadingSpinner text="Loading alerts..." />;

  const severityIcon = (sev) => {
    const icons = { critical: '🔴', danger: '🟠', warning: '🟡', info: '🔵' };
    return icons[sev] || '🔵';
  };

  const senderLabel = (alert) => {
    if (!alert.sentBy) return null;
    const role = alert.sentBy.role === 'admin' ? 'admin' : 'authority';
    return `Sent by ${role}${alert.sentBy.name ? ` (${alert.sentBy.name})` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineBell className="w-5 h-5" />
          <h3 className="font-semibold">Alerts</h3>
          {unreadCount > 0 && (
            <span className="badge badge-critical">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary-500 hover:text-primary-600 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <HiOutlineBell className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No alerts yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border transition-all ${
                alert.isRead
                  ? 'bg-gray-50 dark:bg-slate-800/50 border-transparent'
                  : 'bg-white dark:bg-slate-800 border-primary-200 dark:border-primary-800 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{severityIcon(alert.severity)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!alert.isRead ? 'font-semibold' : ''}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{alert.message}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-secondary)] mt-2">
                    <span>{timeAgo(alert.createdAt)}</span>
                    {senderLabel(alert) && <span>{senderLabel(alert)}</span>}
                    {alert.incidentId?.status && (
                      <span className="capitalize">
                        Incident: {alert.incidentId.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                {!alert.isRead && (
                  <button onClick={() => markRead(alert._id)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                    <HiOutlineCheck className="w-4 h-4 text-green-500" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsList;
