'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import MobileViewerOptionsPanel from './MobileViewerOptionsPanel';
import type { Circuit } from '@/src/shared/types/circuit';

interface CircuitInfoPanelProps {
  isVisible: boolean;
  onToggleSectorInfoAction: (enabled: boolean) => void;
  onToggleDRSInfoAction: (enabled: boolean) => void;
  onToggleElevationAction: (enabled: boolean) => void;
  sectorInfoEnabled: boolean;
  drsInfoEnabled: boolean;
  elevationEnabled: boolean;
  currentCircuit?: Circuit;
  drsZoneCount: number;
  drsDetectionCount: number;
}

const CircuitInfoPanel: React.FC<CircuitInfoPanelProps> = ({
  isVisible,
  onToggleSectorInfoAction,
  onToggleDRSInfoAction,
  onToggleElevationAction,
  sectorInfoEnabled,
  drsInfoEnabled,
  elevationEnabled,
  currentCircuit,
  drsZoneCount,
  drsDetectionCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileBottomSheetOpen, setIsMobileBottomSheetOpen] = useState(false);
  const { language } = useLanguage();


  if (!isVisible) return null;

  // 접힌 상태에서는 작은 버튼만 표시
  if (isCollapsed) {
    return (
      <div className="fixed right-[10px] top-20 sm:left-4 sm:top-1/4 sm:transform sm:-translate-y-1/2 transition-all duration-300 ease-in-out z-50">
        <button
          onClick={() => {
            // 모바일에서는 바텀시트 열기, 데스크톱에서는 기존 동작
            if (window.innerWidth < 640) {
              setIsMobileBottomSheetOpen(true);
            } else {
              setIsCollapsed(false);
            }
          }}
          className="w-[29px] h-[29px] sm:w-12 sm:h-12 flex items-center justify-center text-white bg-[#1A1A1A]/60 hover:bg-[#1A1A1A]/80 sm:bg-red-600/90 rounded-lg shadow-2xl sm:shadow-2xl border border-[#FF1801]/20 hover:border-[#FF1801]/40 sm:border-2 sm:border-red-400/50 backdrop-blur-sm transition-all duration-300"
          aria-label="Show circuit info panel"
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full hidden sm:block"></div>
          {/* 데스크톱 화살표 아이콘 */}
          <svg className="w-6 h-6 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          {/* 모바일 레이어 아이콘 */}
          <svg className="w-6 h-6 block sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11H5m14-4H9m10 8H7m12-4H9" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed right-[10px] top-20 sm:left-4 sm:top-1/4 sm:transform sm:-translate-y-1/2 transition-all duration-300 ease-in-out z-50 ${
        isExpanded ? 'w-80 sm:w-80' : 'w-[29px] sm:w-12'
      }`}>
      {/* 토글 버튼 - 더 눈에 띄게 */}
      <button
        onClick={() => {
          // 모바일에서는 바텀시트 열기, 데스크톱에서는 기존 동작
          if (window.innerWidth < 640) {
            setIsMobileBottomSheetOpen(true);
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
        className={`w-[29px] h-[29px] sm:w-12 sm:h-12 flex items-center justify-center text-white rounded-lg shadow-2xl border border-[#FF1801]/20 hover:border-[#FF1801]/40 sm:border-2 backdrop-blur-sm transition-all duration-300 ${
          isExpanded 
            ? 'bg-[#1A1A1A]/60 hover:bg-[#1A1A1A]/80 sm:bg-blue-600/90 sm:border-blue-400/50' 
            : 'bg-[#1A1A1A]/60 hover:bg-[#1A1A1A]/80 sm:bg-red-600/90 sm:border-red-400/50'
        }`}
        aria-label={isExpanded ? 'Close circuit info panel' : 'Open circuit info panel'}
      >
        {!isExpanded && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full hidden sm:block"></div>
        )}
        {/* 모바일: 레이어 아이콘, 데스크톱: 화살표 아이콘 */}
        <svg 
          className={`w-6 h-6 ${isExpanded ? 'rotate-180' : ''} hidden sm:block`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        
        {/* 모바일 전용 레이어 아이콘 */}
        <svg 
          className="w-6 h-6 block sm:hidden"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 11H5m14-4H9m10 8H7m12-4H9" />
        </svg>
      </button>

      {/* 확장된 패널 배경 */}
      {isExpanded && (
        <div className="absolute top-0 left-0 w-80 bg-black/90 backdrop-blur-sm rounded-lg border-2 border-white/30 shadow-2xl">
          {/* 빈 공간 (버튼 자리) */}
          <div className="w-12 h-12"></div>
          
          {/* 패널 콘텐츠 */}
          <div className="p-4 pt-0">
          {/* 헤더 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg tracking-wide">
                {language === 'ko' ? '서킷 정보' : 'CIRCUIT INFO'}
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
                {language === 'ko' ? '섹터 정보' : 'Sector Information'}
              </h4>
              <button
                onClick={() => onToggleSectorInfoAction(!sectorInfoEnabled)}
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
                <span>{language === 'ko' ? '섹터 1 마커 및 트랙 색상' : 'Sector 1 Markers & Track Colors'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>{language === 'ko' ? '섹터 2 마커 및 트랙 색상' : 'Sector 2 Markers & Track Colors'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>{language === 'ko' ? '섹터 3 마커 및 트랙 색상' : 'Sector 3 Markers & Track Colors'}</span>
              </div>
            </div>
          </div>

          {/* DRS 정보 컨트롤 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                {language === 'ko' ? 'DRS 정보' : 'DRS Information'}
              </h4>
              <button
                onClick={() => onToggleDRSInfoAction(!drsInfoEnabled)}
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
                  <span>{language === 'ko' ? `DRS 감지 구역 ${i + 1}` : `DRS Detection Zone ${i + 1}`}</span>
                </div>
              ))}
              {drsDetectionCount === 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>{language === 'ko' ? 'DRS 감지 구역 없음' : 'No DRS Detection Zones'}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>{language === 'ko' ? '속도 측정 구간' : 'Speed Trap'}</span>
              </div>
              <div className="text-white/50 text-xs mt-1">
                + {language === 'ko' ? 'DRS 구역 애니메이션' : 'DRS Zone Animations'}
              </div>
            </div>
          </div>

          {/* 3D 고저차 정보 컨트롤 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                {language === 'ko' ? '3D 고저차 트랙' : '3D Elevation Track'}
              </h4>
              <button
                onClick={() => onToggleElevationAction(!elevationEnabled)}
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
                <span>{language === 'ko' ? '낮은 고도 (0-30m)' : 'Low Elevation (0-30m)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>{language === 'ko' ? '중간 고도 (30-60m)' : 'Medium Elevation (30-60m)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>{language === 'ko' ? '높은 고도 (60m+)' : 'High Elevation (60m+)'}</span>
              </div>
              <div className="text-white/50 text-xs mt-1">
                + {language === 'ko' ? '실제 지형 데이터 시각화' : 'Real terrain data visualization'}
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
                    {drsZoneCount} {language === 'ko' ? 'DRS 구역' : `DRS Zone${drsZoneCount !== 1 ? 's' : ''}`}
                  </div>
                  <div className="mt-1">
                    {drsDetectionCount} {language === 'ko' ? 'DRS 감지 구역' : `DRS Detection Zone${drsDetectionCount !== 1 ? 's' : ''}`}
                  </div>
                </>
              ) : (
                <div>{language === 'ko' ? '서킷을 선택하여 세부 정보 보기' : 'Select a circuit to view details'}</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 모바일 바텀시트 */}
      <MobileViewerOptionsPanel
        isVisible={isMobileBottomSheetOpen}
        onClose={() => setIsMobileBottomSheetOpen(false)}
        onToggleSectorInfoAction={onToggleSectorInfoAction}
        onToggleDRSInfoAction={onToggleDRSInfoAction}
        onToggleElevationAction={onToggleElevationAction}
        sectorInfoEnabled={sectorInfoEnabled}
        drsInfoEnabled={drsInfoEnabled}
        elevationEnabled={elevationEnabled}
        currentCircuit={currentCircuit}
        drsZoneCount={drsZoneCount}
        drsDetectionCount={drsDetectionCount}
      />
      </div>
    </>
  );
};

export default CircuitInfoPanel;