import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(result.user.role === 'tourist' ? '/tourist' : '/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30"
          >
            <HiOutlineShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-[var(--text-secondary)] mt-1">Sign in to Tourist Safety Monitor</p>
        </div>

        {/* Form */}
        <div className="glass-card-solid p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-11"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">Register</Link>
            </p>
          </div>

          {/* Quick login hints */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-800">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Demo Accounts:</p>
            <p className="text-xs text-[var(--text-secondary)]">Authority: admin@safety.com / admin123</p>
            <p className="text-xs text-[var(--text-secondary)]">Tourist: john@tourist.com / tourist123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
