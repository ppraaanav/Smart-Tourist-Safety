import { useEffect, useState, useCallback } from 'react';
import { HiOutlineSignal } from 'react-icons/hi2';

import StatsCards from '../components/dashboard/StatsCards';
import AdvancedMap from '../components/dashboard/AdvancedMap'; // ✅ use this
import IncidentPanel from '../components/dashboard/IncidentPanel';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';

import { analyticsAPI, incidentAPI } from '../services/api';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthorityDashboard = () => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [dashRes, incRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        incidentAPI.getAll({ limit: 50 })
      ]);

      setStats(dashRes.data?.overview || null);
      setIncidents(incRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔥 REAL-TIME: New Incident
  useSocket('incident:new', (data) => {
    if (!data?.incident) return;

    setIncidents(prev => [data.incident, ...prev]);

    toast.error(
      `New ${data.incident.severity} incident: ${data.incident.type}`,
      {
        duration: 6000,
        icon: data.incident.type === 'sos' ? '🆘' : '⚠️'
      }
    );

    setStats(prev => prev ? {
      ...prev,
      openIncidents: (prev.openIncidents || 0) + 1,
      totalIncidents: (prev.totalIncidents || 0) + 1,
      ...(data.incident.severity === 'critical'
        ? { criticalIncidents: (prev.criticalIncidents || 0) + 1 }
        : {})
    } : prev);
  });

  // 🔥 REAL-TIME: Incident Update
  useSocket('incident:updated', (updated) => {
    if (!updated?._id) return;

    setIncidents(prev =>
      prev.map(i => i._id === updated._id ? updated : i)
    );
  });

  // 🔥 SOS ALERT
  useSocket('sos:alert', (data) => {
    toast.error(
      `🆘 SOS from ${data.tourist.name} (${data.tourist.dtid})!`,
      { duration: 10000 }
    );
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' }
  ];

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Authority Dashboard</h1>
          <p className="text-[var(--text-secondary)] text-sm flex items-center gap-2 mt-1">
            <HiOutlineSignal className="w-4 h-4 text-green-500" />
            Real-time monitoring active
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ✅ Advanced Map */}
          <div className="lg:col-span-2">
            <AdvancedMap incidents={incidents} />
          </div>

          {/* Incident Panel */}
          <div className="lg:col-span-1">
            <IncidentPanel incidents={incidents} onUpdate={fetchData} />
          </div>

        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && <AnalyticsCharts />}

    </div>
  );
};

export default AuthorityDashboard;