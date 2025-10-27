import React, { useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToastContext } from './definitions/ToastContext';
import type { ToastMessage, ToastType } from '../types';

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = uuidv4();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
