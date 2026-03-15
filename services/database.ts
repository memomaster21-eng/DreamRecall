import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Dream {
  id: number;
  title: string;
  content: string;
  date: string;
  tags?: string;
  createdAt: number;
}

const DREAMS_KEY = 'dreams_storage';

let dreamsCache: Dream[] | null = null;

export const initDatabase = async () => {
  try {
    const data = await AsyncStorage.getItem(DREAMS_KEY);
    dreamsCache = data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Database initialization error:', error);
    dreamsCache = [];
  }
};

const saveDreams = async (dreams: Dream[]) => {
  try {
    await AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(dreams));
    dreamsCache = dreams;
  } catch (error) {
    console.error('Error saving dreams:', error);
    throw error;
  }
};

const loadDreams = async (): Promise<Dream[]> => {
  if (dreamsCache !== null) {
    return dreamsCache;
  }
  
  try {
    const data = await AsyncStorage.getItem(DREAMS_KEY);
    dreamsCache = data ? JSON.parse(data) : [];
    return dreamsCache;
  } catch (error) {
    console.error('Error loading dreams:', error);
    return [];
  }
};

export const addDream = async (dream: Omit<Dream, 'id' | 'createdAt'>) => {
  const dreams = await loadDreams();
  const newId = dreams.length > 0 ? Math.max(...dreams.map(d => d.id)) + 1 : 1;
  
  const newDream: Dream = {
    ...dream,
    id: newId,
    createdAt: Date.now(),
  };
  
  dreams.unshift(newDream);
  await saveDreams(dreams);
  
  return newId;
};

export const getAllDreams = async (): Promise<Dream[]> => {
  const dreams = await loadDreams();
  return dreams.sort((a, b) => b.createdAt - a.createdAt);
};

export const getDreamById = async (id: number): Promise<Dream | null> => {
  const dreams = await loadDreams();
  return dreams.find(d => d.id === id) || null;
};

export const getRandomDream = async (excludeId?: number): Promise<Dream | null> => {
  const dreams = await loadDreams();
  const filtered = excludeId ? dreams.filter(d => d.id !== excludeId) : dreams;
  
  if (filtered.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};

export const getLatestDream = async (): Promise<Dream | null> => {
  const dreams = await loadDreams();
  if (dreams.length === 0) return null;
  
  return dreams.reduce((latest, current) => 
    current.createdAt > latest.createdAt ? current : latest
  );
};

export const updateDream = async (id: number, dream: Partial<Omit<Dream, 'id' | 'createdAt'>>) => {
  const dreams = await loadDreams();
  const index = dreams.findIndex(d => d.id === id);
  
  if (index === -1) {
    throw new Error('Dream not found');
  }
  
  dreams[index] = {
    ...dreams[index],
    ...dream,
  };
  
  await saveDreams(dreams);
};

export const deleteDream = async (id: number) => {
  const dreams = await loadDreams();
  const filtered = dreams.filter(d => d.id !== id);
  await saveDreams(filtered);
};

export const getDreamsCount = async (): Promise<number> => {
  const dreams = await loadDreams();
  return dreams.length;
};

export const exportDreamsToJSON = async (): Promise<string> => {
  const dreams = await loadDreams();
  const exportData = {
    version: '1.0',
    app: 'DreamRecall',
    exportDate: new Date().toISOString(),
    dreamsCount: dreams.length,
    dreams: dreams.map(d => ({
      id: d.id,
      title: d.title,
      content: d.content,
      date: d.date,
      tags: d.tags || '',
      createdAt: d.createdAt,
    })),
  };
  return JSON.stringify(exportData, null, 2);
};

export const importDreamsFromJSON = async (jsonData: string): Promise<{ success: number; total: number }> => {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.dreams || !Array.isArray(data.dreams)) {
      throw new Error('Invalid JSON format: dreams array not found');
    }
    
    const currentDreams = await loadDreams();
    const maxId = currentDreams.length > 0 ? Math.max(...currentDreams.map(d => d.id)) : 0;
    
    const validDreams = data.dreams.filter((dream: any) => 
      dream && typeof dream === 'object' && (dream.title || dream.content)
    );
    
    const importedDreams: Dream[] = validDreams.map((dream: any, index: number) => ({
      id: maxId + index + 1,
      title: dream.title || 'بدون عنوان',
      content: dream.content || '',
      date: dream.date || new Date().toISOString(),
      tags: dream.tags || '',
      createdAt: dream.createdAt || (Date.now() + index),
    }));
    
    const allDreams = [...currentDreams, ...importedDreams];
    await saveDreams(allDreams);
    
    return {
      success: importedDreams.length,
      total: data.dreams.length,
    };
  } catch (error) {
    console.error('Error importing dreams:', error);
    throw new Error('Invalid JSON format or corrupted file');
  }
};

export const clearAllDreams = async () => {
  await saveDreams([]);
};

export type DateFilter = 'all' | 'week' | 'month' | 'year';

export const searchDreams = async (
  query: string,
  dateFilter: DateFilter = 'all'
): Promise<Dream[]> => {
  const dreams = await loadDreams();
  
  let filtered = dreams;
  
  // Apply date filter
  if (dateFilter !== 'all') {
    const now = new Date();
    const filterDate = new Date();
    
    switch (dateFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    filtered = dreams.filter((dream) => {
      const dreamDate = new Date(dream.date);
      return dreamDate >= filterDate;
    });
  }
  
  // Apply search query
  if (query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    filtered = filtered.filter((dream) => {
      const titleMatch = dream.title.toLowerCase().includes(searchTerm);
      const contentMatch = dream.content.toLowerCase().includes(searchTerm);
      const tagsMatch = dream.tags?.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || contentMatch || tagsMatch;
    });
  }
  
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
};
