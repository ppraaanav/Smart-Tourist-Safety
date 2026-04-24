import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';
import HeatmapView from '../components/dashboard/HeatmapView';
import { useEffect, useState } from 'react';
import { HiOutlineChartBar } from 'react-icons/hi2';
import { analyticsAPI } from '../services/api';

const AnalyticsPage = () => {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    analyticsAPI.getHeatmap({ days: 30 })
      .then(res => setHeatmapData(res.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HiOutlineChartBar className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <AnalyticsCharts />

      <div>
        <h2 className="text-lg font-semibold mb-4">Incident Heatmap</h2>
        <HeatmapView data={heatmapData} />
      </div>
    </div>
  );
};

export default AnalyticsPage;
