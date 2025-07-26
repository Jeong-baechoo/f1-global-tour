import { create } from 'zustand';

type Language = 'en' | 'ko';

interface AppState {
  // 전역 앱 상태
  isLoading: boolean;
  error: string | null;
  language: Language;
  
  // 액션
  setLanguage: (language: Language) => void;
}

const createStore = (set: (partial: Partial<AppState>) => void) => ({
  // 초기 상태
  isLoading: false,
  error: null,
  language: 'en' as Language,
  
  // 액션 구현
  setLanguage: (language: Language) => set({ language }),
});

// devtools 일시적으로 비활성화
// 현재 사용하지 않더라도 해당 상수는 유지하는 것이 좋음
export const useAppStore = create<AppState>()(createStore);