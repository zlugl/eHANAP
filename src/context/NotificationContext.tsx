import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NotificationItem, UserRole } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { storageAdapter } from '../lib/storageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import { isNotificationRecipient } from '../utils/notificationUtils';
import {
  subscribeToSupabaseTable,
  saveRecord,
  updateRecord,
  deleteRecord,
  SUPABASE_TABLES,
} from '../services/supabaseService';

export interface NotificationContextFilter {
  userEmail?: string;
  seekerId?: string;
  seekerUserId?: string;
  currentUserRole?: UserRole;
}

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
  markAllNotificationsRead: (recipientId: string, contextFilter?: NotificationContextFilter) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: (recipientId: string, contextFilter?: NotificationContextFilter) => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    storageAdapter.getStoredNotifications(INITIAL_NOTIFICATIONS)
  );
  const notificationsRef = useRef<NotificationItem[]>(notifications);
  notificationsRef.current = notifications;

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

    notificationsRef.current = [notif, ...notificationsRef.current];
    setNotifications((prev) => [notif, ...prev]);

    if (isSupabaseConfigured()) {
      saveRecord(SUPABASE_TABLES.NOTIFICATIONS, notif).catch((err) => {
        console.warn('[Supabase] Failed to persist notification:', err);
      });
    }
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    const next = notificationsRef.current.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    notificationsRef.current = next;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    if (isSupabaseConfigured()) {
      updateRecord(SUPABASE_TABLES.NOTIFICATIONS, notificationId, { read: true }).catch((err) => {
        console.warn('[Supabase] Failed to mark notification read:', err);
      });
    }
  }, []);

  const markAllNotificationsRead = useCallback(
    (recipientId: string, contextFilter?: NotificationContextFilter) => {
      const recipientContext = {
        userId: recipientId,
        userEmail: contextFilter?.userEmail,
        seekerId: contextFilter?.seekerId,
        seekerUserId: contextFilter?.seekerUserId,
        currentUserRole: contextFilter?.currentUserRole,
      };

      const targetIds = notificationsRef.current
        .filter((n) => !n.read && isNotificationRecipient(n, recipientContext))
        .map((n) => n.id);

      notificationsRef.current = notificationsRef.current.map((n) =>
        isNotificationRecipient(n, recipientContext) ? { ...n, read: true } : n
      );
      setNotifications((prev) =>
        prev.map((n) =>
          isNotificationRecipient(n, recipientContext) ? { ...n, read: true } : n
        )
      );

      if (isSupabaseConfigured()) {
        targetIds.forEach((id) => {
          updateRecord(SUPABASE_TABLES.NOTIFICATIONS, id, { read: true }).catch((err) => {
            console.warn('[Supabase] Failed to mark all notifications read:', err);
          });
        });
      }
    },
    []
  );

  const deleteNotification = useCallback((notificationId: string) => {
    notificationsRef.current = notificationsRef.current.filter((n) => n.id !== notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (isSupabaseConfigured()) {
      deleteRecord(SUPABASE_TABLES.NOTIFICATIONS, notificationId).catch((err) => {
        console.warn('[Supabase] Failed to delete notification:', err);
      });
    }
  }, []);

  const clearAllNotifications = useCallback(
    (recipientId: string, contextFilter?: NotificationContextFilter) => {
      const recipientContext = {
        userId: recipientId,
        userEmail: contextFilter?.userEmail,
        seekerId: contextFilter?.seekerId,
        seekerUserId: contextFilter?.seekerUserId,
        currentUserRole: contextFilter?.currentUserRole,
      };

      const targetIds = notificationsRef.current
        .filter((n) => isNotificationRecipient(n, recipientContext, null, { includeBroadcasts: false }))
        .map((n) => n.id);

      notificationsRef.current = notificationsRef.current.filter(
        (n) => !isNotificationRecipient(n, recipientContext, null, { includeBroadcasts: false })
      );
      setNotifications((prev) =>
        prev.filter((n) => !isNotificationRecipient(n, recipientContext, null, { includeBroadcasts: false }))
      );

      if (isSupabaseConfigured()) {
        targetIds.forEach((id) => {
          deleteRecord(SUPABASE_TABLES.NOTIFICATIONS, id).catch((err) => {
            console.warn('[Supabase] Failed to clear notification:', err);
          });
        });
      }
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
