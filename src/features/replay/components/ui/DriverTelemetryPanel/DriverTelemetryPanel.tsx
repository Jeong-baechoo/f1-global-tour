'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DriverTelemetryPanelProps {
  className?: string;
  speed?: number; // km/h
  gear?: number; // 1-8, 0 for neutral, -1 for reverse
  throttle?: number; // 0-100%
  brake?: number; // 0-100%
  drsEnabled?: boolean;
  drsAvailable?: boolean;
  driverCode?: string;
  teamColor?: string;
}

export function DriverTelemetryPanel({
  className,
  speed = 0,
  gear = 1,
  throttle = 0,
  brake = 0,
  drsEnabled = false,
  drsAvailable = false,
  driverCode = '',
  teamColor = '#ffffff'
}: DriverTelemetryPanelProps) {
  const formatSpeed = (speed: number) => Math.round(speed).toString();
  const formatGear = (gear: number) => {
    if (gear === -1) return 'R';
    if (gear === 0) return 'N';
    return gear.toString();
  };

  return (
    <div className={cn(
      "rounded-3xl shadow-2xl p-1.5 transition-shadow duration-300 text-white font-mono",
      "min-w-[280px]",
      className
    )}
    style={{
      backgroundColor: 'rgba(18, 18, 20, 0.65)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))'
    }}>
      <div className="relative rounded-3xl p-6">
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
            {formatSpeed(speed)}
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
        {/* Throttle */}
        <div>
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-3">
            Throttle
          </div>
          <div className="relative">
            <div className="relative w-20 h-12 mx-auto">
              {/* Background arc - 정확히 6시(180도) 기준 좌우대칭 */}
              <div 
                className="w-20 h-20 rounded-full absolute -top-2"
                style={{
                  background: `conic-gradient(from 180deg at 50% 50%, 
                    transparent 0deg,
                    transparent 45deg,
                    #374151 45deg, 
                    #374151 315deg,
                    transparent 315deg,
                    transparent 360deg)`,
                  maskImage: `radial-gradient(circle at 50% 50%, transparent 28px, black 32px)`
                }}
              ></div>
              
              {/* Progress arc - 정확히 6시(180도) 기준 좌우대칭 */}
              <div 
                className="w-20 h-20 rounded-full absolute -top-2"
                style={{
                  background: `conic-gradient(from 180deg at 50% 50%, 
                    transparent 0deg,
                    transparent 45deg,
                    #10b981 45deg, 
                    #10b981 ${45 + (throttle * 2.7)}deg,
                    transparent ${45 + (throttle * 2.7)}deg,
                    transparent 360deg)`,
                  maskImage: `radial-gradient(circle at 50% 50%, transparent 28px, black 32px)`
                }}
              ></div>
              
              {/* Center value */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg font-bold text-white mt-2">
                  {Math.round(throttle)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brake */}
        <div>
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-3">
            Brake
          </div>
          <div className="relative">
            <div className="relative w-20 h-12 mx-auto">
              {/* Background arc - 정확히 6시(180도) 기준 좌우대칭 */}
              <div 
                className="w-20 h-20 rounded-full absolute -top-2"
                style={{
                  background: `conic-gradient(from 180deg at 50% 50%, 
                    transparent 0deg,
                    transparent 45deg,
                    #374151 45deg, 
                    #374151 315deg,
                    transparent 315deg,
                    transparent 360deg)`,
                  maskImage: `radial-gradient(circle at 50% 50%, transparent 28px, black 32px)`
                }}
              ></div>
              
              {/* Progress arc - 정확히 6시(180도) 기준 좌우대칭 */}
              <div 
                className="w-20 h-20 rounded-full absolute -top-2"
                style={{
                  background: `conic-gradient(from 180deg at 50% 50%, 
                    transparent 0deg,
                    transparent 45deg,
                    #ef4444 45deg, 
                    #ef4444 ${45 + (brake * 2.7)}deg,
                    transparent ${45 + (brake * 2.7)}deg,
                    transparent 360deg)`,
                  maskImage: `radial-gradient(circle at 50% 50%, transparent 28px, black 32px)`
                }}
              ></div>
              
              {/* Center value */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg font-bold text-white mt-2">
                  {Math.round(brake)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DRS */}
      <div>
        <div className="text-center">
          <div className={cn(
            "text-6xl font-bold uppercase tracking-wider transition-all duration-200 mb-3",
            drsEnabled 
              ? "text-green-400" 
              : drsAvailable 
                ? "text-yellow-400" 
                : "text-gray-400"
          )}>
            DRS
          </div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>ENABLED</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span>AVAILABLE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>CLOSED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}