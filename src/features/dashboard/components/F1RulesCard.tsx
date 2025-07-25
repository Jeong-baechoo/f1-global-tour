'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

// F1 룰 데이터 - 컴포넌트 외부로 이동
const F1_RULES_DATA = [
  {
    category: { en: 'about F1 Rules', ko: 'F1 룰에 대해' },
    items: [
      { en: 'What is DRS is', ko: 'DRS란 무엇인가' },
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

export default function F1RulesCard() {
  const { language } = useLanguage();

  return (
    <div className="bg-transparent p-6 w-full h-full flex flex-col">
      {F1_RULES_DATA.map((section, index) => (
        <div key={`section-${index}`} className="flex flex-col h-full">
          <div className="mb-3 pb-3 border-b border-yellow-500/20">
            <h2 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {getText(section.category, language)}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 flex-1 overflow-y-auto">
            {section.items.map((item, itemIndex) => (
              <div key={`rule-${itemIndex}`} className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-2 hover:border-yellow-500/40 hover:bg-yellow-500/10 transition-all duration-300 hover:shadow-md hover:shadow-yellow-500/20">
                <div className="text-white text-sm cursor-pointer hover:text-yellow-200 transition-colors">
                  {getText(item, language)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}