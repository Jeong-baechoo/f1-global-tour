'use client';

import React from 'react';
import { Team } from '../types';
import { getText } from '@/utils/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeamMarkerProps {
  team: Team;
  isSelected?: boolean;
  onClick?: (team: Team) => void;
}

export const TeamMarker: React.FC<TeamMarkerProps> = ({ 
  team, 
  isSelected = false,
  onClick 
}) => {
  const { language } = useLanguage();
  const isMobile = window.innerWidth < 640;
  
  // Use team colors from data
  const teamColor = team.colors?.primary || '#666666';
  const teamSecondaryColor = team.colors?.secondary || '#FFFFFF';
  
  // Get team abbreviation
  const getTeamAbbreviation = (name: string): string => {
    const teamAbbr: Record<string, string> = {
      'Red Bull Racing': 'RBR',
      'Mercedes': 'MER',
      'Ferrari': 'FER',
      'McLaren': 'MCL',
      'Alpine': 'ALP',
      'AlphaTauri': 'AT',
      'Aston Martin': 'AM',
      'Williams': 'WIL',
      'Alfa Romeo': 'AR',
      'Haas': 'HAA'
    };
    return teamAbbr[name] || name.substring(0, 3).toUpperCase();
  };
  
  const teamName = getText(team.name, 'en');
  const teamAbbr = getTeamAbbreviation(teamName);
  
  return (
    <div 
      className="marker team-marker"
      onClick={() => onClick?.(team)}
      style={{ 
        position: 'absolute',
        width: isMobile ? '60px' : '80px',
        height: isMobile ? '71px' : '95px',
        cursor: 'pointer'
      }}
    >
      {/* Main box */}
      <div 
        style={{
          width: isMobile ? '60px' : '80px',
          height: isMobile ? '60px' : '80px',
          borderRadius: '4px',
          backgroundColor: 'white',
          border: `3px solid ${teamColor}`,
          boxShadow: `0 2px 10px ${teamColor}80`,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 4px 20px ${teamColor}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 2px 10px ${teamColor}80`;
        }}
      >
        {/* Team color stripe */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20%',
          backgroundColor: teamColor,
          borderBottom: `2px solid ${teamSecondaryColor}`
        }} />
        
        {/* Team abbreviation */}
        <div style={{
          fontSize: isMobile ? '18px' : '24px',
          fontWeight: '900',
          color: teamColor,
          letterSpacing: '-0.02em',
          marginTop: '20%'
        }}>
          {teamAbbr}
        </div>
        
        {/* Team name (small) */}
        <div style={{
          fontSize: isMobile ? '8px' : '9px',
          color: '#666',
          marginTop: '2px',
          textAlign: 'center',
          padding: '0 4px'
        }}>
          {getText(team.name, language).toUpperCase()}
        </div>
      </div>
      
      {/* Bottom arrow/pointer */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '0',
        height: '0',
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `15px solid ${teamColor}`,
      }} />
    </div>
  );
};