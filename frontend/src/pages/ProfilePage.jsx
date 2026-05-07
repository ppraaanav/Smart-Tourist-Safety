import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTrash, HiOutlineUserCircle } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' }
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm account deletion');
      return;
    }

    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      toast.success('Account deleted');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <HiOutlineUserCircle className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-solid p-8"
      >
        {/* DTID Card */}
        <div className="mb-8 p-6 rounded-2xl gradient-bg text-white text-center">
          <p className="text-xs opacity-80 mb-1">Digital Tourist ID</p>
          <p className="text-2xl font-bold tracking-wider">{user?.dtid || 'N/A'}</p>
          <p className="text-sm opacity-80 mt-2">{user?.email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input type="text" value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input type="tel" value={formData.phone}
                onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nationality</label>
              <input type="text" value={formData.nationality}
                onChange={e => setFormData(f => ({ ...f, nationality: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 space-y-3">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Emergency Contact</p>
            <input type="text" placeholder="Name" value={formData.emergencyContact.name}
              onChange={e => setFormData(f => ({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))}
              className="input-field" />
            <div className="grid grid-cols-2 gap-3">
              <input type="tel" placeholder="Phone" value={formData.emergencyContact.phone}
                onChange={e => setFormData(f => ({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))}
                className="input-field" />
              <input type="text" placeholder="Relation" value={formData.emergencyContact.relation}
                onChange={e => setFormData(f => ({ ...f, emergencyContact: { ...f.emergencyContact, relation: e.target.value } }))}
                className="input-field" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-solid p-6 border border-red-200 dark:border-red-900/60"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <HiOutlineTrash className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-red-600 dark:text-red-400">Delete Account</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              This permanently deletes your account. Tourist accounts also remove their saved location logs, incidents, and alerts.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="input-field"
              />
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== 'DELETE'}
                className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
