import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NotificationItem, UserRole } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { storageAdapter } from '../lib/storageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  subscribeToSupabaseTable,
  saveRecord,
  updateRecord,
  deleteRecord,
  SUPABASE_TABLES,
} from '../services/supabaseService';

export interface NewNotificationInput {
  recipientId: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'action' | string;
  link?: string;
  actionUrl?: string;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notifData: NewNotificationInput) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (recipientId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: (
    recipientId: string,
    contextFilter?: {
      userEmail?: string;
      seekerId?: string;
      seekerUserId?: string;
      currentUserRole?: UserRole;
    }
  ) => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    storageAdapter.getStoredNotifications(INITIAL_NOTIFICATIONS)
  );

  useEffect(() => {
    storageAdapter.setStoredNotifications(notifications);
  }, [notifications]);

  // Subscribe to real-time notifications in Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    try {
      const unsub = subscribeToSupabaseTable<NotificationItem>(
        SUPABASE_TABLES.NOTIFICATIONS,
        (data) => {
          if (data && data.length > 0) {
            setNotifications((prev) => {
              const map = new Map<string, NotificationItem>();
              prev.forEach((n) => map.set(n.id, n));
              data.forEach((n) => map.set(n.id, n));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }
      );
      return () => {
        unsub();
      };
    } catch (err) {
      console.warn('[NotificationContext] Realtime subscription notice:', err);
    }
  }, []);

  const addNotification = useCallback((notifData: NewNotificationInput) => {
    const validTypes: ('info' | 'success' | 'warning' | 'action')[] = ['info', 'success', 'warning', 'action'];
    const resolvedType: 'info' | 'success' | 'warning' | 'action' = validTypes.includes(
      notifData.type as any
    )
      ? (notifData.type as any)
      : 'info';

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientId: notifData.recipientId,
      recipientRole: notifData.recipientRole || 'job_seeker',
      title: notifData.title,
      message: notifData.message,
      type: resolvedType,
      read: false,
      createdAt: new Date().toISOString(),
      link: notifData.link || notifData.actionUrl || '/seeker/dashboard',
    };

    setNotifications((prev) => [notif, ...prev]);

    if (isSupabaseConfigured()) {
      saveRecord(SUPABASE_TABLES.NOTIFICATIONS, notif).catch((err) => {
        console.warn('[Supabase] Failed to persist notification:', err);
      });
    }
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          const updated = { ...n, read: true };
          if (isSupabaseConfigured()) {
            updateRecord(SUPABASE_TABLES.NOTIFICATIONS, notificationId, { read: true }).catch((err) => {
              console.warn('[Supabase] Failed to mark notification read:', err);
            });
          }
          return updated;
        }
        return n;
      })
    );
  }, []);

  const markAllNotificationsRead = useCallback((recipientId: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.recipientId === recipientId || (recipientId === 'admin' && n.recipientRole === 'admin')) {
          if (isSupabaseConfigured()) {
            updateRecord(SUPABASE_TABLES.NOTIFICATIONS, n.id, { read: true }).catch((err) => {
              console.warn('[Supabase] Failed to mark all notifications read:', err);
            });
          }
          return { ...n, read: true };
        }
        return n;
      })
    );
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (isSupabaseConfigured()) {
      deleteRecord(SUPABASE_TABLES.NOTIFICATIONS, notificationId).catch((err) => {
        console.warn('[Supabase] Failed to delete notification:', err);
      });
    }
  }, []);

  const clearAllNotifications = useCallback(
    (
      recipientId: string,
      contextFilter?: {
        userEmail?: string;
        seekerId?: string;
        seekerUserId?: string;
        currentUserRole?: UserRole;
      }
    ) => {
      const emailLower = (contextFilter?.userEmail || '').toLowerCase();
      const seekerId = contextFilter?.seekerId;
      const seekerUserId = contextFilter?.seekerUserId;
      const role = contextFilter?.currentUserRole;

      setNotifications((prev) =>
        prev.filter((n) => {
          const isTarget =
            n.recipientId === recipientId ||
            (emailLower && n.recipientId?.toLowerCase() === emailLower) ||
            (seekerId && n.recipientId === seekerId) ||
            (seekerUserId && n.recipientId === seekerUserId) ||
            (role === 'admin' && n.recipientRole === 'admin') ||
            (!n.recipientId && role && n.recipientRole === role);

          if (isTarget) {
            if (isSupabaseConfigured()) {
              deleteRecord(SUPABASE_TABLES.NOTIFICATIONS, n.id).catch((err) => {
                console.warn('[Supabase] Failed to clear notification:', err);
              });
            }
            return false;
          }
          return true;
        })
      );
    },
    []
  );

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
