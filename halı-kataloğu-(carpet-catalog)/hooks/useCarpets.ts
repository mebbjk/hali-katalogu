import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Carpet } from '../types';
import { extractCarpetDetails, findMatchingCarpet } from '../services/geminiService';
import { getAllCarpets, addCarpetDB, updateCarpetDB, deleteCarpetDB, replaceAllCarpetsDB } from '../services/dbService';

// Helper to convert a file to a Base64 data URL for persistent storage in IndexedDB
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const useCarpets = () => {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load carpets from IndexedDB on initial render
  useEffect(() => {
    const loadCarpets = async () => {
      try {
        setLoading(true);
        setError(null);
        const storedCarpets = await getAllCarpets();
        storedCarpets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCarpets(storedCarpets);
      } catch (e) {
        console.error("Failed to load carpets from DB", e);
        setError("Failed to load carpet data.");
      } finally {
        setLoading(false);
      }
    };
    loadCarpets();
  }, []);

  const addCarpet = useCallback(async (carpetData: Partial<Carpet>, imageFile: File): Promise<Carpet> => {
    try {
      const imageUrl = await fileToDataUrl(imageFile);
      const newCarpet: Carpet = {
        id: uuidv4(),
        imageUrl: imageUrl,
        name: carpetData.name || 'Unnamed Carpet',
        brand: carpetData.brand || 'Unknown',
        model: carpetData.model || 'Unknown',
        price: carpetData.price || 0,
        size: carpetData.size || [],
        pattern: carpetData.pattern || 'Unknown',
        texture: carpetData.texture || 'Unknown',
        yarnType: carpetData.yarnType || [],
        type: carpetData.type || 'Unknown',
        description: carpetData.description || 'No description provided.',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        barcodeId: carpetData.barcodeId,
        qrCodeId: carpetData.qrCodeId,
      };
      await addCarpetDB(newCarpet);
      setCarpets(prev => [newCarpet, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return newCarpet;
    } catch (e) {
        console.error("Failed to add carpet:", e);
        setError("Failed to save carpet data.");
        throw e;
    }
  }, []);

  const updateCarpet = useCallback(async (updatedCarpet: Carpet) => {
    try {
        await updateCarpetDB(updatedCarpet);
        setCarpets(prev => prev.map(c => c.id === updatedCarpet.id ? updatedCarpet : c));
    } catch(e) {
        console.error("Failed to update carpet:", e);
        setError("Failed to save carpet data.");
    }
  }, []);

  const deleteCarpet = useCallback(async (carpetId: string) => {
    try {
        await deleteCarpetDB(carpetId);
        setCarpets(prev => prev.filter(c => c.id !== carpetId));
    } catch (e) {
        console.error("Failed to delete carpet:", e);
        setError("Failed to delete carpet data.");
    }
  }, []);

  const toggleFavorite = useCallback(async (carpetId: string) => {
      const carpet = carpets.find(c => c.id === carpetId);
      if (!carpet) return;
      
      const updatedCarpet = { ...carpet, isFavorite: !carpet.isFavorite };
      try {
        await updateCarpetDB(updatedCarpet);
        setCarpets(prev => 
            prev.map(c => c.id === carpetId ? updatedCarpet : c)
        );
      } catch (e) {
        console.error("Failed to toggle favorite:", e);
        setError("Failed to save carpet data.");
      }
  }, [carpets]);

  const replaceAllCarpets = useCallback(async (newCarpets: Carpet[]) => {
    if (!Array.isArray(newCarpets)) {
        console.error("Import failed: provided data is not an array.");
        setError("Import failed: invalid data format.");
        return;
    }
    try {
        await replaceAllCarpetsDB(newCarpets);
        newCarpets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCarpets(newCarpets);
    } catch(e) {
        console.error("Failed to import carpets:", e);
        setError("Failed to import carpet data.");
    }
  }, []);


  // AI-powered functions
  const getDetailsFromImage = useCallback(async (imageFile: File) => {
    try {
      const details = await extractCarpetDetails(imageFile);
      return details;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI analysis.';
      console.error(e);
      throw new Error(errorMessage);
    }
  }, []);

  const findMatchByImage = useCallback(async (imageFile: File) => {
    try {
      const match = await findMatchingCarpet(imageFile, carpets);
      return match;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while finding a match.';
      console.error(e);
      throw new Error(errorMessage);
    }
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
    findMatchByImage,
  };
};