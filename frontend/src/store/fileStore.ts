import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FileState {
  convertHistory: {
    originalFile: {
      name: string;
      size: number;
      type: string;
      url: string;
    };
    status: string;
    taskId: string;
    htmlFileUrl?: string;
  }[];
  setConvertHistory: (convertHistory: FileState['convertHistory']) => void; 
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      convertHistory: [],
      setConvertHistory: (convertHistory) => set({ convertHistory }),
    }),
    {
      name: 'file-store', // localStorage key 名
      // 可选：版本控制或自定义存储等配置
    }
  )
);
