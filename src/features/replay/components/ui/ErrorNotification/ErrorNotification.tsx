'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReplayErrorHandler, { ErrorNotification as ErrorNotificationType } from '../../../services/ReplayErrorHandler';

interface ErrorNotificationProps {
  className?: string;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<ErrorNotificationType[]>([]);

  useEffect(() => {
    // 에러 알림 구독
    const unsubscribe = ReplayErrorHandler.onNotification((notification) => {
      setNotifications(prev => [...prev, notification]);

      // 자동 제거 타이머 설정
      if (notification.duration) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getNotificationStyles = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'border-red-500/50 bg-red-950/90 text-red-100';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-950/90 text-yellow-100';
      case 'info':
        return 'border-blue-500/50 bg-blue-950/90 text-blue-100';
      default:
        return 'border-red-500/50 bg-red-950/90 text-red-100';
    }
  };

  const getIconColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-red-400';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-[100] space-y-2 max-w-md",
      className
    )}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "relative rounded-lg p-4 shadow-lg",
            "backdrop-blur-sm border",
            "animate-in slide-in-from-right-full duration-300",
            getNotificationStyles(notification.type)
          )}
        >
          <div className="flex items-start gap-3">
            {/* 아이콘 */}
            <div className={cn("flex-shrink-0", getIconColor(notification.type))}>
              {getNotificationIcon(notification.type)}
            </div>
            
            {/* 메시지 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-5">
                {notification.message}
              </p>
            </div>
            
            {/* 닫기 버튼 */}
            <button
              onClick={() => removeNotification(notification.id)}
              className={cn(
                "flex-shrink-0 ml-2 p-1 rounded-md",
                "hover:bg-black/20 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-white/20"
              )}
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};