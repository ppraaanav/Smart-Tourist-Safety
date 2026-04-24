import AlertsList from '../components/tourist/AlertsList';
import { HiOutlineBell } from 'react-icons/hi2';

const AlertsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HiOutlineBell className="w-6 h-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Alerts</h1>
      </div>
      <div className="glass-card-solid p-6">
        <AlertsList />
      </div>
    </div>
  );
};

export default AlertsPage;
