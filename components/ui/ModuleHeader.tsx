import React from 'react';

interface ModuleData {
  type?: string;
  id?: string;
  name?: string;
  principal?: string;
  location?: string | { city: string; country: string };
  headquarters?: { city: string; country: string; lat: number; lng: number };
  color?: string;
  drivers?: string[];
  grandPrix?: string;
  length?: number;
  laps?: number;
  corners?: number;
  raceDate?: string;
}

interface ModuleHeaderProps {
  module: 'next-race' | 'circuit-detail' | 'team-hq';
  data: ModuleData | null | undefined;
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
  const showFullHeader = !isMobile || sheetState === 'peek';
  const showSimpleHeader = isMobile && (sheetState === 'half' || sheetState === 'full');

  const moduleConfig: Record<string, ModuleConfig> = {
    'next-race': {
      label: 'NEXT RACE',
      title: data?.grandPrix || 'AUSTRIAN GRAND PRIX',
      color: '#FFFFFF'
    },
    'circuit-detail': {
      label: 'CIRCUIT DETAIL',
      title: data?.name || 'Red Bull Ring',
      subtitle: typeof data?.location === 'string' ? data.location : 
        `${data?.location?.city || 'Spielberg'}, ${data?.location?.country || 'Austria'}`,
      color: '#FFFFFF'
    },
    'team-hq': {
      label: 'TEAM HQ',
      title: data?.name || 'Mercedes-AMG Petronas F1 Team',
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