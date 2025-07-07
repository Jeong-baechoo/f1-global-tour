'use client';

import React, { useState } from 'react';

interface CircuitInfoPanelProps {
  isVisible: boolean;
  onToggleSectorInfo: (enabled: boolean) => void;
  onToggleDRSInfo: (enabled: boolean) => void;
  sectorInfoEnabled: boolean;
  drsInfoEnabled: boolean;
}

const CircuitInfoPanel: React.FC<CircuitInfoPanelProps> = ({
  isVisible,
  onToggleSectorInfo,
  onToggleDRSInfo,
  sectorInfoEnabled,
  drsInfoEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className={`fixed left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-50 ${
      isExpanded ? 'w-80' : 'w-20'
    }`}>
      {/* 토글 버튼 - 더 눈에 띄게 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-20 h-20 flex items-center justify-center text-white rounded-xl transition-all duration-200 shadow-2xl border-2 ${
          isExpanded 
            ? 'bg-blue-600/90 border-blue-400/50 hover:bg-blue-500/90' 
            : 'bg-red-600/90 border-red-400/50 hover:bg-red-500/90 animate-pulse'
        }`}
        aria-label={isExpanded ? 'Close circuit info panel' : 'Open circuit info panel'}
      >
        {!isExpanded && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
        )}
        <svg 
          className={`w-10 h-10 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 확장된 패널 배경 */}
      {isExpanded && (
        <div className="absolute top-0 left-0 w-80 bg-black/90 backdrop-blur-sm rounded-lg border-2 border-white/30 shadow-2xl">
          {/* 빈 공간 (버튼 자리) */}
          <div className="w-20 h-20"></div>
          
          {/* 패널 콘텐츠 */}
          <div className="p-4 pt-0">
          {/* 헤더 */}
          <div className="mb-4">
            <h3 className="text-white font-semibold text-lg tracking-wide">
              CIRCUIT INFO
            </h3>
            <div className="w-full h-px bg-white/20 mt-2"></div>
          </div>

          {/* 섹터 정보 컨트롤 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                Sector Information
              </h4>
              <button
                onClick={() => onToggleSectorInfo(!sectorInfoEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  sectorInfoEnabled ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                    sectorInfoEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Sector 1 Markers & Track Colors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Sector 2 Markers & Track Colors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>Sector 3 Markers & Track Colors</span>
              </div>
            </div>
          </div>

          {/* DRS 정보 컨트롤 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                DRS Information
              </h4>
              <button
                onClick={() => onToggleDRSInfo(!drsInfoEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  drsInfoEnabled ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                    drsInfoEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>DRS Detection Zone 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>DRS Detection Zone 2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>DRS Detection Zone 3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Speed Trap</span>
              </div>
              <div className="text-white/50 text-xs mt-1">
                + DRS Zone Animations
              </div>
            </div>
          </div>

            {/* 푸터 정보 */}
            <div className="text-xs text-white/40 text-center pt-2 border-t border-white/10">
              Red Bull Ring - Austria
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitInfoPanel;