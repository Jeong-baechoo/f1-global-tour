import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type Language = 'en' | 'ko';

interface AppState {
  // 전역 앱 상태
  isLoading: boolean;
  error: string | null;
  language: Language;
  
  // 액션
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLanguage: (language: Language) => void;
}

const createStore = (set: any) => ({
  // 초기 상태
  isLoading: false,
  error: null,
  language: 'en' as Language,
  
  // 액션 구현
  setLoading: (loading: boolean) => set({ isLoading: loading }, false, 'setLoading'),
  setError: (error: string | null) => set({ error }, false, 'setError'),
  setLanguage: (language: Language) => set({ language }, false, 'setLanguage'),
});

// devtools 일시적으로 비활성화
export const useAppStore = create<AppState>()(createStore);