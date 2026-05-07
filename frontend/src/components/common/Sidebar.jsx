import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  HiOutlineHome, HiOutlineExclamationTriangle, HiOutlineUsers,
  HiOutlineMap, HiOutlineChartBar, HiOutlineBell, HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle, HiOutlineShieldCheck, HiOutlineBars3,
  HiOutlineXMark, HiOutlineUserCircle
} from 'react-icons/hi2';
import ThemeToggle from './ThemeToggle';
import useAuthStore from '../../stores/authStore';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  const authorityLinks = [
    { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/incidents', icon: HiOutlineExclamationTriangle, label: 'Incidents' },
    { to: '/tourists', icon: HiOutlineUsers, label: 'Tourists' },
    { to: '/geofences', icon: HiOutlineMap, label: 'Geofences' },
    { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    { to: '/alerts', icon: HiOutlineBell, label: 'Alerts' },
    { to: '/profile', icon: HiOutlineUserCircle, label: 'Profile' }
  ];

  const touristLinks = [
    { to: '/tourist', icon: HiOutlineHome, label: 'Home' },
    { to: '/tourist/alerts', icon: HiOutlineBell, label: 'My Alerts' },
    { to: '/tourist/profile', icon: HiOutlineUserCircle, label: 'Profile' }
  ];

  const links = isAuthority ? authorityLinks : touristLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-[var(--border-color)]">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
          <HiOutlineShieldCheck className="w-6 h-6 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-base font-bold gradient-text whitespace-nowrap">SafeTravel</h1>
              <p className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                {isAuthority ? 'Authority Panel' : 'Tourist App'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-[var(--border-color)] space-y-2">
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors hidden lg:block"
            >
              <HiOutlineBars3 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">{user?.dtid || user?.role}</p>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass-card-solid shadow-lg"
      >
        {mobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className={`fixed lg:relative z-40 h-screen bg-[var(--bg-card)] border-r border-[var(--border-color)]
          transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: collapsed ? 80 : 260 }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};

export default Sidebar;
