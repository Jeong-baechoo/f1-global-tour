'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

interface CircuitInfoPanelProps {
  isVisible: boolean;
  onToggleSectorInfo: (enabled: boolean) => void;
  onToggleDRSInfo: (enabled: boolean) => void;
  onToggleElevation: (enabled: boolean) => void;
  sectorInfoEnabled: boolean;
  drsInfoEnabled: boolean;
  elevationEnabled: boolean;
  currentCircuit?: any;
  drsZoneCount: number;
  drsDetectionCount: number;
}

const CircuitInfoPanel: React.FC<CircuitInfoPanelProps> = ({
  isVisible,
  onToggleSectorInfo,
  onToggleDRSInfo,
  onToggleElevation,
  sectorInfoEnabled,
  drsInfoEnabled,
  elevationEnabled,
  currentCircuit,
  drsZoneCount,
  drsDetectionCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { language } = useLanguage();


  if (!isVisible) return null;

  // 접힌 상태에서는 작은 버튼만 표시
  if (isCollapsed) {
    return (
      <div className="fixed left-4 top-1/3 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-12 h-12 flex items-center justify-center text-white bg-blue-600/90 hover:bg-blue-500/90 rounded-lg shadow-2xl border-2 border-blue-400/50 transition-all duration-200"
          aria-label="Show circuit info panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed left-4 top-1/3 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-50 ${
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
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg tracking-wide">
                CIRCUIT INFO
              </h3>
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-white/70 hover:text-white transition-colors duration-200"
                aria-label="Collapse circuit info panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
              {Array.from({ length: drsDetectionCount }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-green-500' : 
                    i === 1 ? 'bg-orange-500' : 
                    'bg-purple-500'
                  }`}></div>
                  <span>DRS Detection Zone {i + 1}</span>
                </div>
              ))}
              {drsDetectionCount === 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>No DRS Detection Zones</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Speed Trap</span>
              </div>
              <div className="text-white/50 text-xs mt-1">
                + DRS Zone Animations
              </div>
            </div>
          </div>

          {/* 3D 고저차 정보 컨트롤 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                3D Elevation Track
              </h4>
              <button
                onClick={() => onToggleElevation(!elevationEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  elevationEnabled ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                    elevationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Low Elevation (0-30m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Medium Elevation (30-60m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>High Elevation (60m+)</span>
              </div>
              <div className="text-white/50 text-xs mt-1">
                + Real terrain data visualization
              </div>
            </div>
          </div>

            {/* 푸터 정보 */}
            <div className="text-xs text-white/40 text-center pt-2 border-t border-white/10">
              {currentCircuit ? (
                <>
                  <div>
                    {getText(currentCircuit.name, language)} - {getText(currentCircuit.location.country, language)}
                  </div>
                  <div className="mt-1">
                    {drsZoneCount} DRS Zone{drsZoneCount !== 1 ? 's' : ''}
                  </div>
                  <div className="mt-1">
                    {drsDetectionCount} DRS Detection Zone{drsDetectionCount !== 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <div>Select a circuit to view details</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitInfoPanel;