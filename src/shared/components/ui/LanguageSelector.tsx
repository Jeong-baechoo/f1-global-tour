'use client';

import { useState, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Language } from '@/contexts/LanguageContext';

interface LanguageData {
  code: Language;
  name: string;
  flag: string;
}

const languages: LanguageData[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

// CSS 클래스 상수화
const STYLES = {
  container: 'relative',
  button: {
    base: 'flex items-center bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors rounded-md text-white/80 hover:text-white',
    mobile: 'gap-0.5 px-2 py-1',
    desktop: 'sm:gap-2 sm:px-3 sm:py-2',
  },
  dropdown: {
    backdrop: 'fixed inset-0 z-40',
    menu: {
      base: 'absolute bg-black/80 backdrop-blur-sm rounded-md shadow-xl border border-white/10 overflow-hidden z-50 w-fit',
      mobile: 'top-full mt-2 right-0 min-w-[130px]',
      desktop: 'sm:top-auto sm:bottom-full sm:mb-2 sm:mt-0 sm:left-0 sm:right-auto sm:min-w-[140px]',
    },
    item: {
      base: 'w-full flex items-center justify-between hover:bg-white/10 transition-colors whitespace-nowrap',
      mobile: 'gap-1 pl-2 py-1.5 pr-2 text-xs',
      desktop: 'sm:gap-3 sm:pl-3 sm:py-2 sm:pr-2 sm:text-sm',
      active: 'bg-white/20 text-white',
      inactive: 'text-white/80 hover:text-white',
    },
  },
  icon: {
    globe: 'w-3 h-3 sm:w-5 sm:h-5',
    chevron: 'w-4 h-4 transition-transform',
    check: 'flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 text-[#FF1801]',
  },
  flag: {
    button: 'text-lg',
    dropdown: 'text-base sm:text-lg',
  },
} as const;

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChangeAction: (language: Language) => void;
}

export default function LanguageSelector({ currentLanguage, onLanguageChangeAction }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 메모화된 현재 언어 정보
  const currentLang = useMemo(
    () => languages.find(lang => lang.code === currentLanguage) || languages[0],
    [currentLanguage]
  );

  // 화살표 방향 계산
  const getChevronRotation = useMemo(() => {
    if (isOpen) {
      return 'sm:rotate-0 rotate-180'; // 데스크톱: 아래, 모바일: 위
    }
    return 'sm:rotate-180 rotate-0'; // 데스크톱: 위, 모바일: 아래
  }, [isOpen]);

  // CSS 클래스 조합 함수
  const combineClasses = (...classes: string[]) => classes.join(' ');

  return (
    <div className={STYLES.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={combineClasses(
          STYLES.button.base,
          STYLES.button.mobile,
          STYLES.button.desktop
        )}
        aria-label="언어 선택"
      >
        <GlobeAltIcon className={STYLES.icon.globe} />
        <span className={STYLES.flag.button}>{currentLang.flag}</span>
        <ChevronDownIcon className={combineClasses(STYLES.icon.chevron, getChevronRotation)} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={STYLES.dropdown.backdrop}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={combineClasses(
            STYLES.dropdown.menu.base,
            STYLES.dropdown.menu.mobile,
            STYLES.dropdown.menu.desktop
          )}>
            {languages.map((language) => {
              const isSelected = currentLanguage === language.code;
              
              return (
                <button
                  key={language.code}
                  onClick={() => {
                    onLanguageChangeAction(language.code);
                    setIsOpen(false);
                  }}
                  className={combineClasses(
                    STYLES.dropdown.item.base,
                    STYLES.dropdown.item.mobile,
                    STYLES.dropdown.item.desktop,
                    isSelected ? STYLES.dropdown.item.active : STYLES.dropdown.item.inactive
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <span className={STYLES.flag.dropdown}>{language.flag}</span>
                    <span className="font-medium truncate">{language.name}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className={STYLES.icon.check} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}