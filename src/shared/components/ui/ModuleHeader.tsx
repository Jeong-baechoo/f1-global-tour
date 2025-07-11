import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import type { PanelData } from '@/types/panel';

interface ModuleHeaderProps {
  module: 'next-race' | 'circuit-detail' | 'team-hq';
  data: PanelData | null | undefined;
  isMobile: boolean;
  sheetState: 'closed' | 'peek' | 'half' | 'full';
}

interface ModuleConfig {
  label: string;
  title: string;
  subtitle?: string;
  color: string;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ module, data, isMobile, sheetState }) => {
  const { language } = useLanguage();
  const showFullHeader = !isMobile || sheetState === 'peek';
  const showSimpleHeader = isMobile && (sheetState === 'half' || sheetState === 'full');

  const moduleConfig: Record<string, ModuleConfig> = {
    'next-race': {
      label: language === 'ko' ? '다음 레이스' : 'NEXT RACE',
      title: data?.grandPrix ? getText(data.grandPrix, language) : 'AUSTRIAN GRAND PRIX',
      color: '#FFFFFF'
    },
    'circuit-detail': {
      label: language === 'ko' ? '서킷 세부사항' : 'CIRCUIT DETAIL',
      title: data?.name ? getText(data.name, language) : 'Red Bull Ring',
      subtitle: typeof data?.location === 'string' ? data.location : 
        typeof data?.location === 'object' && 'city' in data.location ?
        `${getText(data.location.city, language)}, ${getText(data.location.country, language)}` :
        'Spielberg, Austria',
      color: '#FFFFFF'
    },
    'team-hq': {
      label: language === 'ko' ? '팀 본부' : 'TEAM HQ',
      title: data?.name ? getText(data.name, language) : 'Mercedes-AMG Petronas F1 Team',
      color: data?.color || '#FFFFFF'
    }
  };

  const config = moduleConfig[module];

  if (showFullHeader) {
    return (
      <div className={isMobile ? "border-b border-[#FF1801]/20 pb-3" : "border-b border-[#FF1801]/20 pb-4"}>
        <h2 className="text-xs text-[#C0C0C0] tracking-widest mb-2">{config.label}</h2>
        <h1 className={isMobile ? "text-xl font-bold tracking-wide" : "text-2xl font-bold tracking-wide"} 
            style={{ color: config.color }}>
          {config.title}
        </h1>
        {config.subtitle && (
          <p className="text-sm text-[#C0C0C0] mt-1">{config.subtitle}</p>
        )}
      </div>
    );
  }

  if (showSimpleHeader) {
    return (
      <div className="border-b border-[#FF1801]/20 pb-4">
        <h1 className="text-xl font-bold tracking-wide" 
            style={{ color: config.color }}>
          {config.title}
        </h1>
        {config.subtitle && (
          <p className="text-sm text-[#C0C0C0] mt-1">{config.subtitle}</p>
        )}
      </div>
    );
  }

  return null;
};