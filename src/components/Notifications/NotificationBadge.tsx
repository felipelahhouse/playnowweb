// 🔔 NOTIFICATION BADGE - Badge de notificações com contador
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationBadgeProps {
  onClick: () => void;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onClick, className = '' }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    // ✅ Listener em TEMPO REAL para friend_requests
    const requestsQuery = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const newCount = snapshot.docs.length;
      
      // Anima quando recebe nova notificação
      if (newCount > unreadCount) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);
        
        // Som de notificação (opcional)
        playNotificationSound();
      }
      
      setUnreadCount(newCount);
      console.log('[NOTIFICATIONS] 🔔 Friend requests pending:', newCount);
    });

    return unsubscribe;
  }, [user?.id, unreadCount]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi129+KZSAgUW7Lq7a5aEw1Jot/tw24hBjZ89t6nVQwRXLPs7KtZEQ1Ko9zvxnMjBzZ99du4Yh4XW7Xt68BqHRFKo93vyHYnCTh//tu/bSQYXbfv7cZxIhNNpd7tx3kpCzx//d7ieSYcYLry7sp4KBVPqOHwynwqDT2B/t/odCgeY73x8NKDMBhRquPx0YQwGU+o4fLVjjkcZsL28N6KNh1Xre7y3ZY+IGfC9+/ekDwdWK3v8+GUPhxlwPjv4JQ9HFit7vPglD4cZMD47+CUPRxYre7z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4cZL//7t+TPRxXru/z4JQ+HGS//+7fkz0cV67v8+CUPhxkv//u35M9HFeu7/PglD4c');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignora erros de autoplay
    } catch {
      // Silencioso se falhar
    }
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2 sm:p-2.5 hover:bg-gray-800/50 rounded-xl transition-all touch-manipulation active:scale-95 ${className} ${
        isAnimating ? 'animate-bounce' : ''
      }`}
      aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
    >
      <Bell className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
        unreadCount > 0 ? 'text-cyan-400 animate-pulse' : 'text-gray-400'
      }`} />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;
