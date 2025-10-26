import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Carpet } from '../types';
import { extractCarpetDetails, findMatchingCarpet } from '../services/geminiService';

const STORAGE_KEY = 'carpet_catalog_data';

export const useCarpets = () => {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load carpets from localStorage on initial render
  useEffect(() => {
    try {
      setLoading(true);
      const storedCarpets = localStorage.getItem(STORAGE_KEY);
      if (storedCarpets) {
        setCarpets(JSON.parse(storedCarpets));
      }
    } catch (e) {
      console.error("Failed to load carpets from storage", e);
      setError("Failed to load carpet data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save carpets to localStorage whenever they change
  useEffect(() => {
    try {
      // Avoid saving during initial load
      if(!loading) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carpets));
      }
    } catch (e) {
      console.error("Failed to save carpets to storage", e);
      setError("Failed to save carpet data.");
    }
  }, [carpets, loading]);
  
  const addCarpet = useCallback(async (carpetData: Partial<Carpet>, imageFile: File): Promise<Carpet> => {
    // Note: This app uses blob URLs which are temporary. For a production app,
    // you would upload the image to a server or store it as base64 in a more robust storage.
    const imageUrl = URL.createObjectURL(imageFile);
    const newCarpet: Carpet = {
      id: uuidv4(),
      imageUrl: imageUrl,
      name: carpetData.name || 'Unnamed Carpet',
      brand: carpetData.brand || 'Unknown',
      model: carpetData.model || 'Unknown',
      price: carpetData.price || 0,
      size: carpetData.size || 'Unknown',
      pattern: carpetData.pattern || 'Unknown',
      texture: carpetData.texture || 'Unknown',
      yarnType: carpetData.yarnType || 'Unknown',
      type: carpetData.type || 'Unknown',
      description: carpetData.description || 'No description provided.',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      barcodeId: carpetData.barcodeId,
      qrCodeId: carpetData.qrCodeId,
    };
    setCarpets(prev => [newCarpet, ...prev]);
    return newCarpet;
  }, []);

  const updateCarpet = useCallback((updatedCarpet: Carpet) => {
    setCarpets(prev => prev.map(c => c.id === updatedCarpet.id ? updatedCarpet : c));
  }, []);

  const deleteCarpet = useCallback((carpetId: string) => {
    setCarpets(prev => {
      const carpetToDelete = prev.find(c => c.id === carpetId);
      if (carpetToDelete?.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(carpetToDelete.imageUrl);
      }
      return prev.filter(c => c.id !== carpetId)
    });
  }, []);

  const toggleFavorite = useCallback((carpetId: string) => {
      setCarpets(prev => 
          prev.map(c => c.id === carpetId ? {...c, isFavorite: !c.isFavorite} : c)
      );
  }, []);

  const replaceAllCarpets = useCallback((newCarpets: Carpet[]) => {
    // A simple validation to ensure we're not setting nonsense data.
    if (Array.isArray(newCarpets)) {
        // Revoke old blob URLs before replacing
        carpets.forEach(carpet => {
            if (carpet.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(carpet.imageUrl);
            }
        });
        setCarpets(newCarpets);
    } else {
        console.error("Import failed: provided data is not an array.");
    }
  }, [carpets]);


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