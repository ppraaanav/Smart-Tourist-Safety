import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUserCircle } from 'react-icons/hi2';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' }
  });
  const [saving, setSaving] = useState(false);

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
    </div>
  );
};

export default ProfilePage;
