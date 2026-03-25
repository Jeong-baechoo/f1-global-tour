'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReplayErrorHandler, { ErrorNotification as ErrorNotificationType } from '../../../services/ReplayErrorHandler';

type NotificationType = 'error' | 'warning' | 'info';

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  style: string;
  iconColor: string;
}> = {
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    style: 'border-red-500/50 bg-red-950/90 text-red-100',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    style: 'border-yellow-500/50 bg-yellow-950/90 text-yellow-100',
    iconColor: 'text-yellow-400',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    style: 'border-blue-500/50 bg-blue-950/90 text-blue-100',
    iconColor: 'text-blue-400',
  },
};

interface ErrorNotificationProps {
  className?: string;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<ErrorNotificationType[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = ReplayErrorHandler.onNotification((notification) => {
      setNotifications(prev => [...prev, notification]);

      if (notification.duration) {
        setTimeout(() => removeNotification(notification.id), notification.duration);
      }
    });

    return unsubscribe;
  }, [removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-[100] space-y-2 max-w-md",
      className
    )}>
      {notifications.map((notification) => {
        const config = NOTIFICATION_CONFIG[notification.type];
        return (
          <div
            key={notification.id}
            className={cn(
              "relative rounded-lg p-4 shadow-lg",
              "backdrop-blur-sm border",
              "animate-in slide-in-from-right-full duration-300",
              config.style
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0", config.iconColor)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-5">
                  {notification.message}
                </p>
              </div>
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
        );
      })}
    </div>
  );
};