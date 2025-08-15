'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getText, type LocalizedText } from '@/utils/i18n';

// F1 룰 타입 정의
interface F1RuleSection {
  category: LocalizedText;
  items: LocalizedText[];
}

// 그리드 레이아웃 상수
const GRID_CONFIG = {
  columns: 'grid-cols-5',
  gapX: 'gap-x-3',
  gapY: 'gap-y-2',
  buttonHeight: 'h-[90px] min-h-[90px]'
} as const;

// F1 룰 데이터
const F1_RULES_DATA: readonly F1RuleSection[] = [
  {
    category: { en: 'about F1 Rules', ko: 'F1 룰에 대해' },
    items: [
      { en: 'What is DRS', ko: 'DRS란 무엇인가' },
      { en: 'about Racing Car', ko: '레이싱 카에 대해' }, 
      { en: 'What is Safety Car', ko: '세이프티 카란 무엇인가' },
      { en: 'Flag Meanings', ko: '깃발의 의미' },
      { en: 'Penalty System', ko: '페널티 시스템' },
      { en: 'Points System', ko: '포인트 시스템' },
      { en: 'Qualifying Format', ko: '예선 형식' },
      { en: 'Sprint Race Rules', ko: '스프린트 레이스 규칙' },
      { en: 'Tire Regulations', ko: '타이어 규정' },
      { en: 'Fuel Regulations', ko: '연료 규정' }
    ]
  }
] as const;

// 룰 버튼 컴포넌트
const RuleButton = ({ text }: { text: string }) => (
  <div className={`flex items-center justify-center px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-xs font-medium text-white/90 cursor-pointer group transition-all duration-300 hover:scale-105 hover:bg-[#ff1801] hover:border-[#ff1801] hover:text-white hover:shadow-lg hover:shadow-[#ff1801]/30 ${GRID_CONFIG.buttonHeight}`}>
    <span className="relative z-10 text-center leading-tight">
      {text}
    </span>
  </div>
);

export default function F1RulesCard() {
  const { language } = useLanguage();

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#ff1801]/30 rounded-2xl p-6 w-full h-full flex flex-col shadow-lg transition-all duration-300">
      {F1_RULES_DATA.map((section, index) => (
        <div key={`section-${index}`} className="flex flex-col h-full">
          <div className="mb-4 pb-3 border-b border-[#ff1801]/30">
            <h2 className="text-white text-lg font-semibold tracking-wide bg-gradient-to-r from-[#ff1801] to-[#ff1801]/80 bg-clip-text text-transparent">
              {getText(section.category, language)}
            </h2>
          </div>
          <div className={`grid ${GRID_CONFIG.columns} ${GRID_CONFIG.gapX} ${GRID_CONFIG.gapY} flex-1 overflow-y-auto overflow-x-hidden p-2 auto-rows-min`}>
            {section.items.map((item, itemIndex) => (
              <RuleButton 
                key={`rule-${itemIndex}`} 
                text={getText(item, language)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}