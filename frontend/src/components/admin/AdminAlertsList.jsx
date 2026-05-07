import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineUser } from 'react-icons/hi2';
import { alertAPI } from '../../services/api';
import { timeAgo } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

const severityClass = {
  critical: 'badge-critical',
  danger: 'badge-high',
  warning: 'badge-medium',
  info: 'badge-info'
};

const AdminAlertsList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertAPI.getSent({ limit: 100 });
        setAlerts(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) return <LoadingSpinner text="Loading sent alerts..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBell className="w-5 h-5" />
        <h3 className="font-semibold">Alerts sent to tourists</h3>
        <span className="badge badge-info">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <HiOutlineBell className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No outgoing alerts yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineUser className="w-3 h-3" />
                      {alert.userId?.name || 'Tourist'} {alert.userId?.dtid ? `(${alert.userId.dtid})` : ''}
                    </span>
                    <span>{timeAgo(alert.createdAt)}</span>
                    {alert.sentBy?.name && <span>Sent by {alert.sentBy.name}</span>}
                  </div>
                </div>
                <span className={`badge ${severityClass[alert.severity] || 'badge-info'}`}>
                  {alert.severity}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAlertsList;
