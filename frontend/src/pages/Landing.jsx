import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineMapPin, HiOutlineBell, HiOutlineCpuChip } from 'react-icons/hi2';

const features = [
  { icon: HiOutlineMapPin, title: 'Live GPS Tracking', desc: 'Real-time location monitoring with geospatial intelligence' },
  { icon: HiOutlineCpuChip, title: 'AI Anomaly Detection', desc: 'Machine learning-powered behavioral analysis' },
  { icon: HiOutlineBell, title: 'Instant Alerts', desc: 'Multi-channel emergency notification system' },
  { icon: HiOutlineShieldCheck, title: 'Safety Zones', desc: 'Geo-fenced areas with automated breach detection' }
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">SafeTravel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-blue-300 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-white text-slate-900 rounded-xl hover:bg-blue-50 transition-colors">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              AI-Powered Safety Platform
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
              Smart Tourist
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Safety System
              </span>
            </h1>
            <p className="text-lg text-blue-200/80 mb-10 max-w-2xl mx-auto">
              Real-time monitoring, AI-driven anomaly detection, and instant incident response
              for comprehensive tourist safety management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-8 py-4 text-base font-semibold bg-white text-slate-900 rounded-xl
                hover:bg-blue-50 transition-all shadow-2xl shadow-white/20">
                Start Monitoring →
              </Link>
              <Link to="/login" className="px-8 py-4 text-base font-semibold border border-white/20 rounded-xl
                hover:bg-white/10 transition-all backdrop-blur">
                Authority Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10
                hover:bg-white/10 transition-all"
            >
              <feat.icon className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
              <p className="text-sm text-blue-200/60">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-blue-200/40">
        <p>Smart Tourist Safety Monitoring System — Final Year Project</p>
      </footer>
    </div>
  );
};

export default Landing;
