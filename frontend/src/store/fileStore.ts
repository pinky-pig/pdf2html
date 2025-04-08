import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware';

interface ConvertHistoryItem {
  originalFile: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
  status: string;
  taskId: string;
  result?: string | null;
  error?: string | null;
  pdfUrl?: string | null;
  updatedAt?: number;
}

interface FileStore {
  convertHistory: ConvertHistoryItem[];
  setConvertHistory: (history: ConvertHistoryItem[]) => void;
  addHistoryItem: (item: ConvertHistoryItem) => void;
  updateHistoryItem: (taskId: string, updates: Partial<ConvertHistoryItem>) => void;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      convertHistory: [],
      
      setConvertHistory: (history) => set({ convertHistory: history }),
      
      addHistoryItem: (item) => set((state) => ({
        convertHistory: [...state.convertHistory, item]
      })),
      
      updateHistoryItem: (taskId, updates) => set((state) => ({
        convertHistory: state.convertHistory.map(item => 
          item.taskId === taskId ? { ...item, ...updates } : item
        )
      }))
    }),
    {
      name: 'file-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        convertHistory: state.convertHistory
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
          }
        }
        return persistedState;
      },
    }
  )
);

export const clearPersistedStore = () => {
  localStorage.removeItem('file-storage');
};
