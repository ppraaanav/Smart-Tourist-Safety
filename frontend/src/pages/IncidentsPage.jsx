import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import IncidentPanel from '../components/dashboard/IncidentPanel';
import { incidentAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchIncidents = async () => {
    try {
      const res = await incidentAPI.getAll({ page, limit: 30 });
      setIncidents(res.data || []);
      setPagination(res.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [page]);

  if (loading) return <LoadingSpinner text="Loading incidents..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HiOutlineExclamationTriangle className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Incidents</h1>
        <span className="badge badge-info">{pagination.total || 0} total</span>
      </div>

      <IncidentPanel incidents={incidents} onUpdate={fetchIncidents} />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                page === i + 1
                  ? 'gradient-bg text-white'
                  : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
