'use client';

import React, { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { glassPanelStyle } from '../styles';

// 상수 정의
const TRACK_EVENTS = {
  SECTOR: 'track:toggleSectorInfo',
  DRS_ZONES: 'track:toggleDRSZones', 
  DRS_ANIMATIONS: 'track:toggleDRSAnimations'
} as const;

const COLORS = {
  SECTOR: {
    indicator: 'bg-blue-500',
    toggle: 'bg-blue-500',
    focus: 'focus:ring-blue-500',
    status: 'text-blue-300 bg-blue-500/20 shadow-blue-500/20',
    dot: 'bg-blue-400 shadow-blue-400/50'
  },
  DRS: {
    indicator: 'bg-green-500', 
    toggle: 'bg-green-500',
    focus: 'focus:ring-green-500',
    status: 'text-green-300 bg-green-500/20 shadow-green-500/20',
    dot: 'bg-green-400 shadow-green-400/50'
  }
} as const;

interface TrackInfoTogglePanelProps {
  className?: string;
  onSectorToggle?: (enabled: boolean) => void;
  onDRSToggle?: (enabled: boolean) => void;
  initialSectorEnabled?: boolean;
  initialDRSEnabled?: boolean;
}

export const TrackInfoTogglePanel: React.FC<TrackInfoTogglePanelProps> = ({
  className,
  onSectorToggle,
  onDRSToggle,
  initialSectorEnabled = false,
  initialDRSEnabled = false
}) => {
  const [sectorEnabled, setSectorEnabled] = useState(initialSectorEnabled);
  const [drsEnabled, setDrsEnabled] = useState(initialDRSEnabled);

  const handleSectorToggle = useCallback(() => {
    const newState = !sectorEnabled;
    setSectorEnabled(newState);
    
    window.dispatchEvent(new CustomEvent(TRACK_EVENTS.SECTOR, { 
      detail: { enabled: newState } 
    }));
    
    onSectorToggle?.(newState);
  }, [sectorEnabled, onSectorToggle]);

  const handleDRSToggle = useCallback(() => {
    const newState = !drsEnabled;
    setDrsEnabled(newState);
    
    [TRACK_EVENTS.DRS_ZONES, TRACK_EVENTS.DRS_ANIMATIONS].forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName, { 
        detail: { enabled: newState } 
      }));
    });
    
    onDRSToggle?.(newState);
  }, [drsEnabled, onDRSToggle]);

  return (
    <div
      className={cn(
        "rounded-3xl shadow-2xl p-4 text-white text-sm transition-shadow duration-300",
        className
      )}
      style={glassPanelStyle}
    >
      {/* 패널 헤더 */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Settings className="w-4 h-4 text-gray-400" />
        <span className="text-base font-bold uppercase tracking-wider text-white">
          TRACK INFO
        </span>
      </div>

      <div className="space-y-3">
        {/* Sector 토글 */}
        <ToggleItem
          label="Sectors"
          enabled={sectorEnabled}
          colors={COLORS.SECTOR}
          onToggle={handleSectorToggle}
        />

        {/* DRS 토글 */}
        <ToggleItem
          label="DRS Zones"
          enabled={drsEnabled}
          colors={COLORS.DRS}
          onToggle={handleDRSToggle}
        />
      </div>

      {/* 상태 인디케이터 */}
      <div className="pt-4 mt-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-4 text-xs font-medium">
          <StatusIndicator label="SECTORS" enabled={sectorEnabled} colors={COLORS.SECTOR} />
          <StatusIndicator label="DRS" enabled={drsEnabled} colors={COLORS.DRS} />
        </div>
      </div>
    </div>
  );
};

// 색상 타입 정의
type ColorScheme = {
  readonly indicator: string;
  readonly toggle: string;
  readonly focus: string;
  readonly status: string;
  readonly dot: string;
};

// 토글 아이템 컴포넌트
interface ToggleItemProps {
  label: string;
  enabled: boolean;
  colors: ColorScheme;
  onToggle: () => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ label, enabled, colors, onToggle }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className={cn("w-3 h-3 rounded-full shadow-lg", colors.indicator)} />
      <span className="text-white font-medium">{label}</span>
    </div>
    <button
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent shadow-lg",
        colors.focus,
        enabled ? colors.toggle : "bg-gray-700"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  </div>
);

// 상태 인디케이터 컴포넌트
interface StatusIndicatorProps {
  label: string;
  enabled: boolean;
  colors: ColorScheme;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, enabled, colors }) => (
  <span className={cn(
    "flex items-center gap-2 px-2.5 py-1 rounded-full transition-all duration-200",
    enabled ? colors.status : "text-gray-400 bg-gray-600/20"
  )}>
    <div className={cn(
      "w-1.5 h-1.5 rounded-full transition-all duration-200",
      enabled ? colors.dot : "bg-gray-500"
    )} />
    {label}
  </span>
);