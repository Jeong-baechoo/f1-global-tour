'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import type { Circuit } from '@/src/shared/types/circuit';

type ViewerOption = 'sector' | 'drs' | 'elevation';

interface MobileViewerOptionsPanelProps {
  isVisible: boolean;
  onClose: () => void;
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

const MobileViewerOptionsPanel: React.FC<MobileViewerOptionsPanelProps> = ({
  isVisible,
  onClose,
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
  const { language } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<ViewerOption>('sector');

  if (!isVisible) return null;

  const handleOptionSelect = (option: ViewerOption) => {
    setSelectedOption(option);
    
    // 선택된 옵션에 따라 토글 상태 변경 (켜짐/꺼짐 토글)
    switch (option) {
      case 'sector':
        onToggleSectorInfoAction(!sectorInfoEnabled);
        break;
      case 'drs':
        onToggleDRSInfoAction(!drsInfoEnabled);
        break;
      case 'elevation':
        onToggleElevationAction(!elevationEnabled);
        break;
    }
  };

  const renderLegendContent = () => {
    switch (selectedOption) {
      case 'sector':
        if (!sectorInfoEnabled) {
          return (
            <div className="space-y-3">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-white/60 text-sm">
                  {language === 'ko' ? '섹터 정보가 비활성화됨' : 'Sector Information Disabled'}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {language === 'ko' ? '버튼을 터치하여 활성화' : 'Tap button to enable'}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? 'Sector 1 마커 및 트랙 색상' : 'Sector 1 Markers & Track Colors'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? 'Sector 2 마커 및 트랙 색상' : 'Sector 2 Markers & Track Colors'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? 'Sector 3 마커 및 트랙 색상' : 'Sector 3 Markers & Track Colors'}
              </span>
            </div>
          </div>
        );

      case 'drs':
        if (!drsInfoEnabled) {
          return (
            <div className="space-y-3">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-white/60 text-sm">
                  {language === 'ko' ? 'DRS 정보가 비활성화됨' : 'DRS Information Disabled'}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {language === 'ko' ? '버튼을 터치하여 활성화' : 'Tap button to enable'}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {Array.from({ length: drsDetectionCount }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  i === 0 ? 'bg-green-500' : 
                  i === 1 ? 'bg-orange-500' : 
                  'bg-purple-500'
                }`}></div>
                <span className="text-white/90 text-sm">
                  {language === 'ko' ? `DRS 감지 구역 ${i + 1}` : `DRS Detection Zone ${i + 1}`}
                </span>
              </div>
            ))}
            {drsDetectionCount === 0 && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-white/90 text-sm">
                  {language === 'ko' ? 'DRS 감지 구역 없음' : 'No DRS Detection Zones'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? '속도 측정 구간' : 'Speed Trap'}
              </span>
            </div>
            <div className="text-white/60 text-xs mt-2">
              + {language === 'ko' ? 'DRS 구역 애니메이션' : 'DRS Zone Animations'}
            </div>
          </div>
        );

      case 'elevation':
        if (!elevationEnabled) {
          return (
            <div className="space-y-3">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-white/60 text-sm">
                  {language === 'ko' ? '지형 고저차가 비활성화됨' : '3D Elevation Disabled'}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {language === 'ko' ? '버튼을 터치하여 활성화' : 'Tap button to enable'}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? '낮은 고도 (0-30m)' : 'Low Elevation (0-30m)'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? '중간 고도 (30-60m)' : 'Medium Elevation (30-60m)'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-white/90 text-sm">
                {language === 'ko' ? '높은 고도 (60m+)' : 'High Elevation (60m+)'}
              </span>
            </div>
            <div className="text-white/60 text-xs mt-2">
              + {language === 'ko' ? '실제 지형 데이터 시각화' : 'Real terrain data visualization'}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out sm:hidden ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-[#1A1A1A] rounded-t-2xl shadow-2xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {/* 빨간색 세로 바 */}
              <div className="w-1 h-6 bg-[#FF1801] rounded-full"></div>
              <h3 className="text-white font-semibold text-lg tracking-wide">
                VIEWER OPTIONS
              </h3>
            </div>
            
            {/* X 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 토글 버튼 섹션 */}
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-3 gap-3">
              {/* Sector 버튼 */}
              <button
                onClick={() => handleOptionSelect('sector')}
                className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 ${
                  sectorInfoEnabled 
                    ? 'bg-blue-500/15 border border-blue-500/50' 
                    : 'bg-white/5 border border-white/20 opacity-60'
                }`}
              >
                {/* 아이콘 박스 */}
                <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  sectorInfoEnabled 
                    ? 'border-blue-500/70 bg-blue-500/10' 
                    : 'border-white/20 bg-white/5'
                }`}>
                  {/* 섹터 차트 아이콘 */}
                  <svg className={`w-6 h-6 ${
                    sectorInfoEnabled 
                      ? 'text-blue-500' 
                      : 'text-white/60'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                {/* 라벨 */}
                <span className={`text-xs font-medium ${
                  sectorInfoEnabled 
                    ? 'text-blue-500' 
                    : 'text-white/60'
                }`}>
                  Sector
                </span>
              </button>

              {/* DRS 버튼 */}
              <button
                onClick={() => handleOptionSelect('drs')}
                className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 ${
                  drsInfoEnabled 
                    ? 'bg-green-500/15 border border-green-500/50' 
                    : 'bg-white/5 border border-white/20 opacity-60'
                }`}
              >
                {/* 아이콘 박스 */}
                <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  drsInfoEnabled 
                    ? 'border-green-500/70 bg-green-500/10' 
                    : 'border-white/20 bg-white/5'
                }`}>
                  {/* DRS 속도계 아이콘 */}
                  <svg className={`w-7 h-7 ${
                    drsInfoEnabled 
                      ? 'text-green-500' 
                      : 'text-white/60'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="round" strokeWidth={3} 
                          d="M4 16a8 8 0 0 1 16 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} 
                          d="m12 16 3-3" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                {/* 라벨 */}
                <span className={`text-xs font-medium ${
                  drsInfoEnabled 
                    ? 'text-green-500' 
                    : 'text-white/60'
                }`}>
                  DRS
                </span>
              </button>

              {/* 3D Elevation 버튼 */}
              <button
                onClick={() => handleOptionSelect('elevation')}
                className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 ${
                  elevationEnabled 
                    ? 'bg-purple-500/15 border border-purple-500/50' 
                    : 'bg-white/5 border border-white/20 opacity-60'
                }`}
              >
                {/* 아이콘 박스 */}
                <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  elevationEnabled 
                    ? 'border-purple-500/70 bg-purple-500/10' 
                    : 'border-white/20 bg-white/5'
                }`}>
                  {/* 3D 고저차 산 아이콘 */}
                  <svg className={`w-6 h-6 ${
                    elevationEnabled 
                      ? 'text-purple-500' 
                      : 'text-white/60'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M5 17h14l-7-10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 17l5-7-2.5-3.5" />
                  </svg>
                </div>
                {/* 라벨 */}
                <span className={`text-xs font-medium ${
                  elevationEnabled 
                    ? 'text-purple-500' 
                    : 'text-white/60'
                }`}>
                  3D Elevation
                </span>
              </button>
            </div>
          </div>

          {/* 동적 범례 섹션 - 최적화된 고정 높이 */}
          <div className={`p-4 h-36 overflow-y-auto flex w-full ${
            (!sectorInfoEnabled && selectedOption === 'sector') ||
            (!drsInfoEnabled && selectedOption === 'drs') ||
            (!elevationEnabled && selectedOption === 'elevation')
              ? 'items-center justify-center' 
              : 'items-start'
          }`}>
            <div className="w-full">
              {renderLegendContent()}
            </div>
          </div>

          {/* 하단 서킷 정보 (있는 경우) */}
          {currentCircuit && (
            <div className="px-4 pb-6 text-center text-xs text-white/40 border-t border-white/10 pt-4">
              <div>
                {getText(currentCircuit.name, language)} - {getText(currentCircuit.location.country, language)}
              </div>
              <div className="mt-1">
                {drsZoneCount} {language === 'ko' ? 'DRS 구역' : `DRS Zone${drsZoneCount !== 1 ? 's' : ''}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileViewerOptionsPanel;