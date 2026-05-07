import AlertsList from '../components/tourist/AlertsList';
import AdminAlertsList from '../components/admin/AdminAlertsList';
import useAuthStore from '../stores/authStore';
import { HiOutlineBell } from 'react-icons/hi2';

const AlertsPage = () => {
  const { user } = useAuthStore();
  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HiOutlineBell className="w-6 h-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">{isAuthority ? 'Sent Alerts' : 'My Alerts'}</h1>
      </div>
      <div className="glass-card-solid p-6">
        {isAuthority ? <AdminAlertsList /> : <AlertsList />}
      </div>
    </div>
  );
};

export default AlertsPage;
