'use client';

import { useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface CinematicModeButtonProps {
  isCircuitView: boolean;
  onToggleAction: () => void;
  'data-cinematic-toggle'?: boolean;
}

export default function CinematicModeButton({ isCircuitView, onToggleAction, ...props }: CinematicModeButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // 서킷 뷰가 아닐 때는 버튼 숨기기
  if (!isCircuitView) return null;

  const handleToggle = () => {
    setIsActive(!isActive);
    onToggleAction();
  };

  return (
    <div className="absolute bottom-20 right-4 z-40" {...props}>
      <div className="relative">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-md whitespace-nowrap">
            {isActive ? '시네마틱 투어 정지' : '시네마틱 투어 시작'}
            <div className="absolute bottom-0 right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90 transform translate-y-full" />
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleToggle}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${isActive 
              ? 'bg-[#FF1801] text-white' 
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
            }
          `}
          aria-label={isActive ? '시네마틱 투어 정지' : '시네마틱 투어 시작'}
        >
          {isActive ? (
            <CameraOff className="w-6 h-6" />
          ) : (
            <Camera className="w-6 h-6" />
          )}

          {/* Pulse animation when active */}
          {isActive && (
            <>
              <span className="absolute inset-0 rounded-full bg-[#FF1801] animate-ping opacity-25" />
              <span className="absolute inset-0 rounded-full bg-[#FF1801] animate-ping opacity-25" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </button>

        {/* Status text - mobile */}
        <div className="sm:hidden mt-2 text-center">
          <span className={`text-xs font-medium ${isActive ? 'text-[#FF1801]' : 'text-gray-500'}`}>
            {isActive ? '투어 중' : '투어 시작'}
          </span>
        </div>
      </div>
    </div>
  );
}