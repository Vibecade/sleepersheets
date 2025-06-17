import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, TrendingUp, Zap, DollarSign, Users } from 'lucide-react';

interface PointsNotificationProps {
  points: number;
  message: string;
  type?: 'achievement' | 'level' | 'points';
  onComplete?: () => void;
}

const PointsNotification: React.FC<PointsNotificationProps> = ({
  points,
  message,
  type = 'points',
  onComplete
}) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Wait for exit animation
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  const getIcon = () => {
    switch (type) {
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'level': return <Star className="w-5 h-5 text-purple-400" />;
      default: return <Zap className="w-5 h-5 text-blue-400" />;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case 'achievement': return 'from-yellow-500/90 to-amber-700/90';
      case 'level': return 'from-purple-500/90 to-indigo-700/90';
      default: return 'from-blue-500/90 to-blue-700/90';
    }
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-xl bg-gradient-to-r ${getBgColor()} backdrop-blur-sm border border-white/20 max-w-xs`}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{message}</p>
              <p className="text-sm text-white/80">+{points} XP</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PointsNotification;