import { create } from 'zustand';

interface FileState {
  convertHistory: {
    originalFile: {
      name: string;
      size: number;
      type: string;
      url: string;
    };
    htmlFileUrl: string;
    isConverting: boolean;
  }[];
  setConvertHistory: (convertHistory: {
    originalFile: {
      name: string;
      size: number;
      type: string;
      url: string;
    };
    htmlFileUrl: string;
    isConverting: boolean;
  }[]) => void; 
}

export const useFileStore = create<FileState>((set) => ({
  convertHistory: [],
  setConvertHistory: (convertHistory) => set({ convertHistory }),
}));
  
