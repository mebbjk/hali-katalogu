import { useState, useEffect, useCallback } from 'react';
import {
  getAllCarpets,
  addCarpetDB,
  updateCarpetDB,
  deleteCarpetDB,
  replaceAllCarpetsDB
} from './services/dbService';
import { getDetailsFromImage as getDetailsFromImageAPI, findMatchByImage as findMatchByImageAPI } from './services/geminiService';
import type { Carpet } from './types';

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export const useCarpets = () => {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCarpets = async () => {
      try {
        setLoading(true);
        const carpetsFromDB = await getAllCarpets();
        setCarpets(carpetsFromDB);
      } catch (e) {
        setError('Failed to load carpets from the database.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadCarpets();
  }, []);

  const addCarpet = useCallback(async (carpetData: Partial<Carpet>, imageFile: File) => {
    try {
      const imageUrl = await fileToDataURL(imageFile);
      const newCarpet: Carpet = {
        id: new Date().toISOString() + Math.random(),
        createdAt: new Date().toISOString(),
        isFavorite: false,
        ...carpetData,
        imageUrl,
        name: carpetData.name || 'Untitled Carpet',
        brand: carpetData.brand || 'Unknown',
        model: carpetData.model || 'N/A',
        price: carpetData.price || 0,
        size: carpetData.size || [],
        pattern: carpetData.pattern || 'N/A',
        texture: carpetData.texture || 'N/A',
        yarnType: carpetData.yarnType || [],
        type: carpetData.type || 'N/A',
        description: carpetData.description || '',
      };
      await addCarpetDB(newCarpet);
      setCarpets(prev => [newCarpet, ...prev]);
      return newCarpet;
    } catch (e) {
      setError('Failed to add carpet.');
      console.error(e);
      throw e;
    }
  }, []);

  const updateCarpet = useCallback(async (updatedCarpet: Carpet) => {
    try {
      await updateCarpetDB(updatedCarpet);
      setCarpets(prev => prev.map(c => c.id === updatedCarpet.id ? updatedCarpet : c));
    } catch (e) {
      setError('Failed to update carpet.');
      console.error(e);
      throw e;
    }
  }, []);

  const deleteCarpet = useCallback(async (carpetId: string) => {
    try {
      await deleteCarpetDB(carpetId);
      setCarpets(prev => prev.filter(c => c.id !== carpetId));
    } catch (e) {
      setError('Failed to delete carpet.');
      console.error(e);
      throw e;
    }
  }, []);

  const toggleFavorite = useCallback(async (carpetId: string) => {
    const carpet = carpets.find(c => c.id === carpetId);
    if (carpet) {
      const updatedCarpet = { ...carpet, isFavorite: !carpet.isFavorite };
      await updateCarpet(updatedCarpet);
    }
  }, [carpets, updateCarpet]);
  
  const replaceAllCarpets = useCallback(async (newCarpets: Carpet[]) => {
      try {
        await replaceAllCarpetsDB(newCarpets);
        setCarpets(newCarpets);
      } catch (e) {
        setError('Failed to import carpets.');
        console.error(e);
        throw e;
      }
  }, []);

  const getDetailsFromImage = useCallback(async (file: File) => {
      return getDetailsFromImageAPI(file);
  }, []);
  
  const findMatchByImage = useCallback(async (file: File) => {
      return findMatchByImageAPI(file, carpets);
  }, [carpets]);

  return {
    carpets,
    loading,
    error,
    addCarpet,
    updateCarpet,
    deleteCarpet,
    toggleFavorite,
    replaceAllCarpets,
    getDetailsFromImage,
    findMatchByImage
  };
};