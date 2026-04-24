import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { touristAPI } from '../services/api';
import { timeAgo } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TouristsPage = () => {
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await touristAPI.getAll({ search, limit: 50 });
        setTourists(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search]);

  const viewDetail = async (id) => {
    try {
      const res = await touristAPI.getById(id);
      setDetail(res.data);
      setSelected(id);
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner text="Loading tourists..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <HiOutlineUsers className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Tourists</h1>
          <span className="badge badge-info">{tourists.length}</span>
        </div>

        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, DTID, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 !w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tourist list */}
        <div className="lg:col-span-2 space-y-3">
          {tourists.map((t, i) => {
            const isActive = t.lastActive && new Date(t.lastActive) > new Date(Date.now() - 30 * 60 * 1000);
            return (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card-solid p-4 cursor-pointer hover:shadow-lg transition-all ${
                  selected === t._id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => viewDetail(t._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                      {t.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{t.dtid} · {t.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {isActive ? 'Active' : timeAgo(t.lastActive)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {detail ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card-solid p-6 sticky top-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {detail.tourist?.name?.charAt(0)}
                </div>
                <h3 className="text-lg font-bold">{detail.tourist?.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{detail.tourist?.dtid}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Email</span><span>{detail.tourist?.email}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Phone</span><span>{detail.tourist?.phone || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Nationality</span><span>{detail.tourist?.nationality || 'N/A'}</span></div>

                {detail.tourist?.emergencyContact?.name && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 mt-4">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Emergency Contact</p>
                    <p className="text-sm">{detail.tourist.emergencyContact.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{detail.tourist.emergencyContact.phone} ({detail.tourist.emergencyContact.relation})</p>
                  </div>
                )}

                {/* Recent incidents */}
                <div className="mt-4">
                  <p className="font-medium mb-2">Recent Incidents ({detail.incidents?.length || 0})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detail.incidents?.slice(0, 5).map(inc => (
                      <div key={inc._id} className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-xs">
                        <div className="flex justify-between">
                          <span className="capitalize font-medium">{inc.type?.replace('_', ' ')}</span>
                          <span className={`badge ${inc.severity === 'critical' ? 'badge-critical' : inc.severity === 'high' ? 'badge-high' : 'badge-medium'}`}>
                            {inc.severity}
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-1">{timeAgo(inc.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card-solid p-8 text-center text-[var(--text-secondary)]">
              <HiOutlineUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a tourist to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TouristsPage;
