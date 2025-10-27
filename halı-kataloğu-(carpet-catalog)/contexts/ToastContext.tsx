// FIX: Switched to namespace import (`import * as React`) to resolve a persistent module
// initialization error. This pattern ensures that all React APIs are accessed as properties
// of the React object, which can prevent issues where named imports are evaluated as undefined.
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ToastMessage, ToastType, ToastContextType } from '../types';

// 1. Context Creation
const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// 2. Provider Component
interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = 'success') => {
    const id = uuidv4();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// 3. Custom Hook
export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};