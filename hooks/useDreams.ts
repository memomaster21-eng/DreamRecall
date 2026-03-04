import { useState, useEffect, useCallback } from 'react';
import { Dream, getAllDreams, addDream, updateDream, deleteDream, getDreamsCount, exportDreamsToJSON, importDreamsFromJSON, clearAllDreams } from '@/services/database';

export const useDreams = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const loadDreams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDreams();
      setDreams(data);
      const total = await getDreamsCount();
      setCount(total);
    } catch (error) {
      console.error('Error loading dreams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  const createDream = useCallback(async (dream: Omit<Dream, 'id' | 'createdAt'>) => {
    try {
      await addDream(dream);
      await loadDreams();
    } catch (error) {
      console.error('Error creating dream:', error);
      throw error;
    }
  }, [loadDreams]);

  const editDream = useCallback(async (id: number, dream: Partial<Omit<Dream, 'id' | 'createdAt'>>) => {
    try {
      await updateDream(id, dream);
      await loadDreams();
    } catch (error) {
      console.error('Error updating dream:', error);
      throw error;
    }
  }, [loadDreams]);

  const removeDream = useCallback(async (id: number) => {
    try {
      await deleteDream(id);
      await loadDreams();
    } catch (error) {
      console.error('Error deleting dream:', error);
      throw error;
    }
  }, [loadDreams]);

  const exportDreams = useCallback(async () => {
    try {
      return await exportDreamsToJSON();
    } catch (error) {
      console.error('Error exporting dreams:', error);
      throw error;
    }
  }, []);

  const importDreams = useCallback(async (jsonData: string) => {
    try {
      const result = await importDreamsFromJSON(jsonData);
      await loadDreams();
      return result;
    } catch (error) {
      console.error('Error importing dreams:', error);
      throw error;
    }
  }, [loadDreams]);

  const clearAll = useCallback(async () => {
    try {
      await clearAllDreams();
      await loadDreams();
    } catch (error) {
      console.error('Error clearing dreams:', error);
      throw error;
    }
  }, [loadDreams]);

  return {
    dreams,
    loading,
    count,
    createDream,
    editDream,
    removeDream,
    refresh: loadDreams,
    exportDreams,
    importDreams,
    clearAll,
  };
};
