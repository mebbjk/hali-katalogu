import { useState, useEffect, useCallback } from 'react';
import type { Carpet } from '../types';

const STORAGE_KEY = 'carpet_catalog_data';

export const useCarpets = () => {
  const [carpets, setCarpets] = useState<Carpet[]>([]);

  useEffect(() => {
    try {
      const storedCarpets = localStorage.getItem(STORAGE_KEY);
      if (storedCarpets) {
        setCarpets(JSON.parse(storedCarpets));
      }
    } catch (error) {
      console.error("Failed to load carpets from localStorage", error);
    }
  }, []);

  const saveCarpets = useCallback((newCarpets: Carpet[]) => {
    try {
      setCarpets(newCarpets);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCarpets));
    } catch (error) {
      console.error("Failed to save carpets to localStorage", error);
    }
  }, []);

  const addCarpet = useCallback((carpet: Carpet) => {
    saveCarpets([...carpets, carpet]);
  }, [carpets, saveCarpets]);

  const deleteCarpet = useCallback((carpetId: string) => {
    const updatedCarpets = carpets.filter(c => c.id !== carpetId);
    saveCarpets(updatedCarpets);
  }, [carpets, saveCarpets]);
  
  const updateCarpet = useCallback((updatedCarpet: Carpet) => {
    const updatedCarpets = carpets.map(c => c.id === updatedCarpet.id ? updatedCarpet : c);
    saveCarpets(updatedCarpets);
  }, [carpets, saveCarpets]);

  const toggleFavorite = useCallback((carpetId: string) => {
    const carpetToUpdate = carpets.find(c => c.id === carpetId);
    if (carpetToUpdate) {
        const updatedCarpet = { ...carpetToUpdate, isFavorite: !carpetToUpdate.isFavorite };
        updateCarpet(updatedCarpet);
    }
  }, [carpets, updateCarpet]);

  return { carpets, addCarpet, deleteCarpet, updateCarpet, toggleFavorite };
};