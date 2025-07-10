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
  isSelected: _isSelected = false,
  isNextRace = false,
  onClick
}) => {
  // Suppress unused variable warning
  void _isSelected;
  const { language } = useLanguage();
  const isMobile = window.innerWidth < 640;

  // Note: Country flag functionality removed to avoid unused code

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
