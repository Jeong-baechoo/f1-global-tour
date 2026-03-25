'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { glassPanelStyle } from '../styles';

interface DriverTelemetryPanelProps {
  className?: string;
  loading?: boolean;
  speed?: number; // km/h
  gear?: number; // 1-8, 0 for neutral, -1 for reverse
  throttle?: number; // 0-100%
  brake?: number; // 0-100%
  drsEnabled?: boolean;
  drsAvailable?: boolean;
  driverCode?: string;
  teamColor?: string;
}

const ARC_MASK = 'radial-gradient(circle at 50% 50%, transparent 28px, black 32px)';
const ARC_BG = `conic-gradient(from 180deg at 50% 50%, transparent 0deg, transparent 45deg, #374151 45deg, #374151 315deg, transparent 315deg, transparent 360deg)`;

const ArcGauge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const progressDeg = 45 + (value * 2.7);
  return (
    <div>
      <div className="text-sm text-gray-400 uppercase tracking-wider mb-3">
        {label}
      </div>
      <div className="relative">
        <div className="relative w-20 h-12 mx-auto">
          <div
            className="w-20 h-20 rounded-full absolute -top-2"
            style={{ background: ARC_BG, maskImage: ARC_MASK }}
          />
          <div
            className="w-20 h-20 rounded-full absolute -top-2"
            style={{
              background: `conic-gradient(from 180deg at 50% 50%, transparent 0deg, transparent 45deg, ${color} 45deg, ${color} ${progressDeg}deg, transparent ${progressDeg}deg, transparent 360deg)`,
              maskImage: ARC_MASK,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-lg font-bold text-white mt-2">
              {Math.round(value)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DRS_LEGEND = [
  { color: 'bg-green-400', label: 'ENABLED' },
  { color: 'bg-yellow-400', label: 'AVAILABLE' },
  { color: 'bg-gray-400', label: 'CLOSED' },
] as const;

const DRS_GLOW_STYLE = {
  textShadow: '0 0 10px rgba(74, 222, 128, 0.6), 0 0 20px rgba(74, 222, 128, 0.4), 0 0 40px rgba(74, 222, 128, 0.2)',
};

export function DriverTelemetryPanel({
  className,
  loading = false,
  speed = 0,
  gear = 1,
  throttle = 0,
  brake = 0,
  drsEnabled = false,
  drsAvailable = false,
  driverCode = '',
  teamColor = '#ffffff'
}: DriverTelemetryPanelProps) {
  const formatGear = (g: number) => {
    if (g === -1) return 'R';
    if (g === 0) return 'N';
    return g.toString();
  };

  return (
    <div className={cn(
      "rounded-3xl shadow-2xl p-1.5 transition-shadow duration-300 text-white font-mono",
      "min-w-[280px]",
      className
    )}
    style={glassPanelStyle}>
      <div className="relative rounded-3xl p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <>
            {/* Driver Header */}
            {driverCode && (
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <div className="text-base font-bold text-white uppercase tracking-wider">
                  {driverCode}
                </div>
              </div>
            )}

            {/* Speed and Gear */}
            <div className="flex items-end gap-5 mb-5">
              <div className="flex-1">
                <div className="text-5xl font-bold text-white leading-none">
                  {Math.round(speed)}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
                  km/h
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Gear
                </div>
                <div className="text-3xl font-bold text-center bg-gray-800 rounded px-4 py-3 min-w-[3.5rem]">
                  {formatGear(gear)}
                </div>
              </div>
            </div>

            {/* Throttle and Brake */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              <ArcGauge label="Throttle" value={throttle} color="#10b981" />
              <ArcGauge label="Brake" value={brake} color="#ef4444" />
            </div>

            {/* DRS */}
            <div className="text-center">
              <div
                className={cn(
                  "text-6xl font-bold uppercase tracking-wider transition-all duration-200 mb-3",
                  drsEnabled
                    ? "text-green-400"
                    : drsAvailable
                      ? "text-yellow-400"
                      : "text-gray-400"
                )}
                style={drsEnabled ? DRS_GLOW_STYLE : undefined}
              >
                DRS
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-4">
                {DRS_LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", color)} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}