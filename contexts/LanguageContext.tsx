'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  // 초기 언어 설정 (localStorage에서 불러오기 또는 브라우저 언어 감지)
  useEffect(() => {
    const initializeLanguage = () => {
      try {
        const savedLanguage = localStorage.getItem('language');
        
        // 저장된 언어가 유효한지 확인
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
          setLanguage(savedLanguage as Language);
          return;
        }

        // 개발 환경에서는 영어로 고정, 프로덕션에서는 브라우저 언어 감지
        if (process.env.NODE_ENV === 'development') {
          setLanguage('en');
        } else {
          const browserLanguage = navigator.language.toLowerCase();
          const detectedLanguage: Language = browserLanguage.startsWith('ko') ? 'ko' : 'en';
          setLanguage(detectedLanguage);
        }
        
      } catch (error) {
        // localStorage 접근 실패 시 기본값 사용
        console.warn('Failed to access localStorage:', error);
        setLanguage('en');
      }
    };

    initializeLanguage();
  }, []);

  // 언어 변경 시 localStorage에 저장
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    
    try {
      localStorage.setItem('language', newLanguage);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}