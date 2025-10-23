import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from '../../contexts/TranslationContext';

interface MaintenanceNotification {
  enabled: boolean;
  message_en: string;
  message_pt: string;
  message_es: string;
  timestamp: number;
}

const MaintenanceNotificationDisplay: React.FC = () => {
  const [notification, setNotification] = useState<MaintenanceNotification | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const { language } = useTranslation();

  useEffect(() => {
    // Listen to real-time changes
    const unsubscribe = onSnapshot(
      doc(db, 'system', 'maintenance_notification'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as MaintenanceNotification;
          setNotification(data);
          setIsDismissed(false); // Show again if admin updates
        } else {
          setNotification(null);
        }
      },
      (error) => {
        console.error('Error listening to maintenance notification:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const getMessage = () => {
    if (!notification) return '';
    switch (language) {
      case 'pt':
        return notification.message_pt;
      case 'es':
        return notification.message_es;
      default:
        return notification.message_en;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300);
  };

  // Don't show if not enabled, dismissed, or no notification
  if (!notification || !notification.enabled || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed top-[180px] left-0 right-0 z-40 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-br from-orange-500 to-red-500 border-b-2 border-orange-400/30 shadow-lg overflow-hidden">
        <div className="relative h-12 flex items-center">
          {/* Animated scrolling text */}
          <div className="absolute inset-0 flex items-center">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8 px-8">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse flex-shrink-0" />
                <span className="text-white font-bold text-sm">
                  ⚠️ {getMessage()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse flex-shrink-0" />
                <span className="text-white font-bold text-sm">
                  ⚠️ {getMessage()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse flex-shrink-0" />
                <span className="text-white font-bold text-sm">
                  ⚠️ {getMessage()}
                </span>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 p-2 hover:bg-white/20 rounded-md transition-colors z-10"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Pulsating indicator */}
        <div className="absolute top-2 left-2 w-2 h-2">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
          <div className="absolute inset-0 bg-white rounded-full" />
        </div>
      </div>

    </div>
  );
};

export default MaintenanceNotificationDisplay;
