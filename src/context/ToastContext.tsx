import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastNotification } from '../types';

export type ToastInput = 
  | Omit<ToastNotification, 'id' | 'createdAt'>
  | string;

export interface ToastContextType {
  activeToast: ToastNotification | null;
  showToast: (toast: ToastInput, typeOrTitle?: string) => void;
  dismissToast: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);

  const showToast = useCallback((toast: ToastInput, typeOrTitle?: string) => {
    if (typeof toast === 'string') {
      const resolvedType = typeOrTitle || 'info';
      const resolvedTitle = 
        resolvedType === 'success' 
          ? 'Success' 
          : resolvedType === 'error' || resolvedType === 'alert' || resolvedType === 'warning' 
          ? 'Alert' 
          : 'Notice';

      setActiveToast({
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: resolvedTitle,
        message: toast,
        type: resolvedType,
        createdAt: new Date().toISOString(),
      });
    } else if (toast && typeof toast === 'object') {
      setActiveToast({
        ...toast,
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      });
    }
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ activeToast, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
