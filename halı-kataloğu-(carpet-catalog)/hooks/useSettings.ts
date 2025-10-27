import { useContext } from 'react';
import { SettingsContext } from '../contexts/definitions/SettingsContext';
import type { SettingsContextType } from '../types';


export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
