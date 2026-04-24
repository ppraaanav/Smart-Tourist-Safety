import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  
  if (roles && !roles.includes(user?.role)) {
   
    return (
      <Navigate
        to={user?.role === 'tourist' ? '/tourist' : '/dashboard'}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;