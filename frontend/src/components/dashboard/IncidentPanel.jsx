import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamationTriangle, HiOutlineFunnel, HiOutlineEye } from 'react-icons/hi2';
import { INCIDENT_TYPES, STATUS_MAP, SEVERITY_COLORS } from '../../utils/constants';
import { timeAgo } from '../../utils/helpers';
import { incidentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const IncidentPanel = ({ incidents, onUpdate }) => {
  const [filter, setFilter] = useState({ severity: '', type: '', status: '' });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = incidents.filter(inc => {
    if (filter.severity && inc.severity !== filter.severity) return false;
    if (filter.type && inc.type !== filter.type) return false;
    if (filter.status && inc.status !== filter.status) return false;
    return true;
  });

  const handleStatusUpdate = async (id, status) => {
    try {
      await incidentAPI.update(id, { status });
      toast.success(`Incident marked as ${status}`);
      onUpdate?.();
      setShowDetail(false);
    } catch (err) {
      toast.error('Failed to update incident');
    }
  };

  return (
    <div className="glass-card-solid p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HiOutlineExclamationTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">Incidents</h3>
          <span className="badge badge-info">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="w-4 h-4 text-[var(--text-secondary)]" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filter.severity}
          onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}
          className="input-field !w-auto !py-1.5 text-xs"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="input-field !w-auto !py-1.5 text-xs"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={filter.type}
          onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          className="input-field !w-auto !py-1.5 text-xs"
        >
          <option value="">All Types</option>
          {Object.entries(INCIDENT_TYPES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Incident list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-[var(--text-secondary)] text-sm">No incidents match filters</p>
        ) : (
          filtered.map((inc, i) => {
            const typeInfo = INCIDENT_TYPES[inc.type] || { label: inc.type, icon: '⚠️' };
            const statusInfo = STATUS_MAP[inc.status] || { label: inc.status, badge: 'badge-info' };

            return (
              <motion.div
                key={inc._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-xl border border-[var(--border-color)] hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-all"
                onClick={() => { setSelectedIncident(inc); setShowDetail(true); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{typeInfo.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{typeInfo.label}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {inc.dtid || inc.userId?.dtid} · {timeAgo(inc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${SEVERITY_COLORS[inc.severity]?.badge || 'badge-info'}`}>
                      {inc.severity}
                    </span>
                    <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-card-solid p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{INCIDENT_TYPES[selectedIncident.type]?.icon}</span>
                <div>
                  <h3 className="font-bold">{INCIDENT_TYPES[selectedIncident.type]?.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedIncident.dtid}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Severity</span>
                  <span className={`badge ${SEVERITY_COLORS[selectedIncident.severity]?.badge}`}>
                    {selectedIncident.severity} ({selectedIncident.severityScore})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className={`badge ${STATUS_MAP[selectedIncident.status]?.badge}`}>
                    {selectedIncident.status}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Description</span>
                  <p className="mt-1">{selectedIncident.description}</p>
                </div>
                {selectedIncident.userId && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                    <span className="text-[var(--text-secondary)]">Tourist</span>
                    <p className="mt-1 font-medium">{selectedIncident.userId.name || 'Unknown tourist'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {selectedIncident.userId.dtid || selectedIncident.dtid}
                      {selectedIncident.userId.phone ? ` · ${selectedIncident.userId.phone}` : ''}
                    </p>
                    {selectedIncident.userId.email && (
                      <p className="text-xs text-[var(--text-secondary)]">{selectedIncident.userId.email}</p>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-[var(--text-secondary)]">Location</span>
                  <p className="mt-1 font-mono text-xs">
                    [{selectedIncident.location?.coordinates?.join(', ')}]
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Time</span>
                  <p className="mt-1">{new Date(selectedIncident.createdAt).toLocaleString()}</p>
                </div>

                {/* Timeline */}
                {selectedIncident.timeline?.length > 0 && (
                  <div>
                    <span className="text-[var(--text-secondary)] font-medium">Timeline</span>
                    <div className="mt-2 space-y-2 border-l-2 border-primary-200 dark:border-primary-800 pl-4">
                      {selectedIncident.timeline.map((entry, idx) => (
                        <div key={idx} className="text-xs">
                          <p className="font-medium capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                          <p className="text-[var(--text-secondary)]">{entry.notes}</p>
                          <p className="text-[var(--text-secondary)]">{timeAgo(entry.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedIncident.status !== 'resolved' && (
                <div className="flex gap-2 mt-6">
                  {selectedIncident.status === 'open' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedIncident._id, 'investigating')}
                      className="btn-primary flex-1 !py-2 text-sm"
                    >
                      Investigate
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident._id, 'resolved')}
                    className="flex-1 py-2 text-sm rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident._id, 'false_alarm')}
                    className="flex-1 py-2 text-sm rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                  >
                    False Alarm
                  </button>
                </div>
              )}

              <button onClick={() => setShowDetail(false)} className="btn-ghost w-full mt-3 text-sm">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncidentPanel;
