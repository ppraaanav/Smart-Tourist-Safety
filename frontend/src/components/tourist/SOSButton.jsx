import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { incidentAPI } from '../../services/api';
import useGeolocation from '../../hooks/useGeolocation';

const SOSButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { position, getCurrentPosition } = useGeolocation({ enabled: true });

  const handleSOS = async () => {
    setIsSending(true);
    try {
      let coords = position?.coordinates;
      if (!coords) {
        const pos = await getCurrentPosition();
        coords = pos.coordinates;
      }

      await incidentAPI.triggerSOS({
        coordinates: coords,
        description: 'SOS Emergency triggered by tourist'
      });

      toast.success('SOS Alert Sent! Help is on the way.', { duration: 6000, icon: '🆘' });
      setShowConfirm(false);
    } catch (error) {
      toast.error('Failed to send SOS. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Main SOS Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConfirm(true)}
        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white
          shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center gap-1 sos-pulse
          hover:from-red-600 hover:to-red-800 transition-all"
      >
        <HiOutlineExclamationTriangle className="w-10 h-10" />
        <span className="text-lg font-bold">SOS</span>
        <span className="text-[10px] opacity-80">Tap for help</span>
      </motion.button>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isSending && setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-solid p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                <HiOutlineExclamationTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm SOS Alert</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                This will send an emergency alert to all authorities with your current location.
                Only use in genuine emergencies.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isSending}
                  className="btn-ghost flex-1 border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSOS}
                  disabled={isSending}
                  className="btn-danger flex-1"
                >
                  {isSending ? 'Sending...' : 'SEND SOS'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SOSButton;
