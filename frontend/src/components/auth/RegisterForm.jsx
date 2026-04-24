import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed, HiOutlinePhone, HiOutlineGlobeAlt, HiOutlineShieldCheck } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'tourist',
    phone: '', nationality: '',
    emergencyContact: { name: '', phone: '', relation: '' }
  });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData);
    if (result.success) {
      toast.success('Account created successfully!');
      navigate(result.user.role === 'tourist' ? '/tourist' : '/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateEC = (field, value) => setFormData(prev => ({
    ...prev, emergencyContact: { ...prev.emergencyContact, [field]: value }
  }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30"
          >
            <HiOutlineShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-[var(--text-secondary)] mt-1">Join Tourist Safety Monitor</p>
        </div>

        <div className="glass-card-solid p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div className="flex gap-3">
              {['tourist', 'authority'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => update('role', role)}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all
                    ${formData.role === role
                      ? 'gradient-bg text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                >
                  {role === 'tourist' ? '🧳 Tourist' : '🛡️ Authority'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" required value={formData.name} onChange={e => update('name', e.target.value)}
                    className="input-field pl-11" placeholder="John Doe" />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" required value={formData.email} onChange={e => update('email', e.target.value)}
                    className="input-field pl-11" placeholder="your@email.com" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" required minLength={6} value={formData.password}
                  onChange={e => update('password', e.target.value)}
                  className="input-field pl-11" placeholder="Min. 6 characters" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)}
                    className="input-field pl-11" placeholder="+1234567890" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nationality</label>
                <div className="relative">
                  <HiOutlineGlobeAlt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={formData.nationality} onChange={e => update('nationality', e.target.value)}
                    className="input-field pl-11" placeholder="Country" />
                </div>
              </div>
            </div>

            {formData.role === 'tourist' && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 space-y-3">
                <p className="text-sm font-medium">Emergency Contact</p>
                <input type="text" value={formData.emergencyContact.name}
                  onChange={e => updateEC('name', e.target.value)}
                  className="input-field text-sm" placeholder="Contact name" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="tel" value={formData.emergencyContact.phone}
                    onChange={e => updateEC('phone', e.target.value)}
                    className="input-field text-sm" placeholder="Phone" />
                  <input type="text" value={formData.emergencyContact.relation}
                    onChange={e => updateEC('relation', e.target.value)}
                    className="input-field text-sm" placeholder="Relation" />
                </div>
              </div>
            )}

            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
