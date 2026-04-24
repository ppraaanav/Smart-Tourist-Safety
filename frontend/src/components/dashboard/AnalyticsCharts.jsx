import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { analyticsAPI } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { size: 11 } } },
    tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8,
      titleFont: { size: 13 }, bodyFont: { size: 12 } }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 11 } } }
  }
};

const AnalyticsCharts = () => {
  const [trends, setTrends] = useState(null);
  const [responseTimes, setResponseTimes] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, rtRes] = await Promise.all([
          analyticsAPI.getTrends({ days: 7 }),
          analyticsAPI.getResponseTimes()
        ]);
        setTrends(trendRes.data);
        setResponseTimes(rtRes.data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      }
    };
    fetchData();
  }, []);

  // Process trends data for line chart
  const trendChartData = () => {
    if (!trends?.trends) return null;

    const dates = [...new Set(trends.trends.map(t => t._id.date))].sort();
    const types = [...new Set(trends.trends.map(t => t._id.type))];
    const colors = { sos: '#ef4444', anomaly: '#f97316', geofence_breach: '#eab308',
      inactivity: '#3b82f6', route_deviation: '#8b5cf6' };

    return {
      labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: types.map(type => ({
        label: type.replace('_', ' '),
        data: dates.map(date => {
          const found = trends.trends.find(t => t._id.date === date && t._id.type === type);
          return found ? found.count : 0;
        }),
        borderColor: colors[type] || '#6b7280',
        backgroundColor: (colors[type] || '#6b7280') + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 3
      }))
    };
  };

  // Hourly distribution bar chart
  const hourlyChartData = () => {
    if (!trends?.hourlyDistribution) return null;
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [{
        label: 'Incidents per Hour',
        data: hours.map(h => {
          const found = trends.hourlyDistribution.find(d => d._id === h);
          return found ? found.count : 0;
        }),
        backgroundColor: '#3b82f680',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  };

  // Response time doughnut
  const responseChartData = () => {
    if (!responseTimes?.avgResponseBySeverity) return null;
    const labels = Object.keys(responseTimes.avgResponseBySeverity);
    const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data: Object.values(responseTimes.avgResponseBySeverity).map(Number),
        backgroundColor: labels.map(l => colors[l] || '#6b7280'),
        borderWidth: 0
      }]
    };
  };

  const trendData = trendChartData();
  const hourlyData = hourlyChartData();
  const responseData = responseChartData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Incident Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-solid p-6"
      >
        <h3 className="font-semibold mb-4">Incident Trends (7 Days)</h3>
        <div style={{ height: '280px' }}>
          {trendData ? (
            <Line data={trendData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">Loading...</div>
          )}
        </div>
      </motion.div>

      {/* Hourly Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-solid p-6"
      >
        <h3 className="font-semibold mb-4">Hourly Distribution</h3>
        <div style={{ height: '280px' }}>
          {hourlyData ? (
            <Bar data={hourlyData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">Loading...</div>
          )}
        </div>
      </motion.div>

      {/* Response Times */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-solid p-6"
      >
        <h3 className="font-semibold mb-4">Avg Response Time by Severity (min)</h3>
        <div style={{ height: '280px' }} className="flex items-center justify-center">
          {responseData ? (
            <Doughnut data={responseData} options={{
              ...chartOptions,
              scales: undefined,
              cutout: '60%'
            }} />
          ) : (
            <div className="text-[var(--text-secondary)]">Loading...</div>
          )}
        </div>
        {responseTimes && (
          <div className="text-center mt-4">
            <p className="text-2xl font-bold">{responseTimes.overallAvgMinutes} min</p>
            <p className="text-xs text-[var(--text-secondary)]">Overall avg response time ({responseTimes.totalResolved} resolved)</p>
          </div>
        )}
      </motion.div>

      {/* Response by Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card-solid p-6"
      >
        <h3 className="font-semibold mb-4">Response Time by Type</h3>
        {responseTimes?.avgResponseByType ? (
          <div className="space-y-4">
            {Object.entries(responseTimes.avgResponseByType).map(([type, time]) => {
              const maxTime = Math.max(...Object.values(responseTimes.avgResponseByType).map(Number), 1);
              const pct = (Number(time) / maxTime) * 100;
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{time} min</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">Loading...</div>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsCharts;
