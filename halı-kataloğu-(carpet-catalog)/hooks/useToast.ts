import { useContext } from 'react';
import { ToastContext } from '../contexts/definitions/ToastContext';
import type { ToastContextType } from '../types';

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
