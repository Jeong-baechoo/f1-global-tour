'use client';

import React from 'react';
import { Circuit } from '../types';
import { getText } from '@/utils/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface CircuitMarkerProps {
  circuit: Circuit;
  isSelected?: boolean;
  isNextRace?: boolean;
  onClick?: (circuit: Circuit) => void;
}

export const CircuitMarker: React.FC<CircuitMarkerProps> = ({
  circuit,
  isSelected = false,
  isNextRace = false,
  onClick
}) => {
  const { language } = useLanguage();
  const isMobile = window.innerWidth < 640;

  // Get country flag emoji based on country name
  const getCountryFlag = (country: string): string => {
    const countryToCode: Record<string, string> = {
      'Australia': 'AU',
      'Austria': 'AT',
      'Azerbaijan': 'AZ',
      'Bahrain': 'BH',
      'Belgium': 'BE',
      'Brazil': 'BR',
      'Canada': 'CA',
      'China': 'CN',
      'Spain': 'ES',
      'United Kingdom': 'GB',
      'Hungary': 'HU',
      'Italy': 'IT',
      'Japan': 'JP',
      'Mexico': 'MX',
      'Monaco': 'MC',
      'Netherlands': 'NL',
      'Qatar': 'QA',
      'Saudi Arabia': 'SA',
      'Singapore': 'SG',
      'United States': 'US',
      'USA': 'US',
      'United Arab Emirates': 'AE',
      'Germany': 'DE'
    };
    
    const flags: Record<string, string> = {
      'AU': '🇦🇺', 'AT': '🇦🇹', 'AZ': '🇦🇿', 'BH': '🇧🇭', 'BE': '🇧🇪',
      'BR': '🇧🇷', 'CA': '🇨🇦', 'CN': '🇨🇳', 'ES': '🇪🇸', 'GB': '🇬🇧',
      'HU': '🇭🇺', 'IT': '🇮🇹', 'JP': '🇯🇵', 'MX': '🇲🇽', 'MC': '🇲🇨',
      'NL': '🇳🇱', 'QA': '🇶🇦', 'SA': '🇸🇦', 'SG': '🇸🇬', 'US': '🇺🇸',
      'AE': '🇦🇪', 'DE': '🇩🇪'
    };
    
    const code = countryToCode[country];
    return code ? flags[code] || '🏁' : '🏁';
  };

  const countryFlag = circuit.country ? getCountryFlag(circuit.country) : '🏁';

  return (
    <div
      className="circuit-marker"
      data-next-race={isNextRace}
      onClick={() => onClick?.(circuit)}
    >
      {/* Dot container */}
      <div className="circuit-marker__dot-container">
        <div className="circuit-marker__dot" />
        {isNextRace && <div className="circuit-marker__pulse" />}
        
        {/* Connection line */}
        <div className={`circuit-marker__line ${isMobile ? 'circuit-marker__line--mobile' : 'circuit-marker__line--desktop'}`} />
      </div>

      {/* Label */}
      <div 
        className={`circuit-marker__label ${isMobile ? 'circuit-marker__label--mobile' : 'circuit-marker__label--desktop'}`}
        data-next-race={isNextRace}
      >
        <div className={`circuit-marker__city ${isMobile ? 'circuit-marker__city--mobile' : 'circuit-marker__city--desktop'}`}>
          {getText(circuit.location.city, language)}
        </div>
        <div className={`circuit-marker__country ${isMobile ? 'circuit-marker__country--mobile' : 'circuit-marker__country--desktop'}`}>
          {getText(circuit.location.country, language).toUpperCase()}
        </div>
        
        {/* Next Race label for isNextRace */}
        {isNextRace && (
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#FF1801',
            color: '#FFFFFF',
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '2px',
            whiteSpace: 'nowrap'
          }}>
            NEXT RACE
          </div>
        )}
      </div>
    </div>
  );
};
