'use client';

import React, { useCallback, useMemo } from 'react';
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { 
  useReplayIsPlaying,
  useReplayCurrentTime,
  useReplayTotalDuration,
  useReplayPlaybackSpeed,
  useReplayCurrentLap,
  useReplayActions 
} from '@/src/features/replay';
import { cn } from '@/lib/utils';

interface ReplayProgressBarProps {
  className?: string;
}

export const ReplayProgressBar: React.FC<ReplayProgressBarProps> = ({ className }) => {
  const isPlaying = useReplayIsPlaying();
  const currentTime = useReplayCurrentTime();
  const totalDuration = useReplayTotalDuration();
  const playbackSpeed = useReplayPlaybackSpeed();
  const currentLap = useReplayCurrentLap();
  
  const { 
    play,
    pause,
    setPlaybackSpeed,
    seekTo,
    jumpToLap 
  } = useReplayActions();

  const handleTimelineChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    seekTo(newTime);
  }, [seekTo]);

  const handlePreviousLap = useCallback(() => {
    jumpToLap(Math.max(1, currentLap - 1));
  }, [currentLap, jumpToLap]);

  const handleNextLap = useCallback(() => {
    jumpToLap(currentLap + 1);
  }, [currentLap, jumpToLap]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
  }, [setPlaybackSpeed]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const speedOptions = useMemo(() => [0.5, 1, 1.5, 2, 5], []);

  return (
    <div className={cn(
      "rounded-3xl shadow-2xl p-3 transition-shadow duration-300 relative",
      "flex items-center space-x-4 text-white overflow-visible",
      className
    )}
    style={{
      backgroundColor: 'rgba(18, 18, 20, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 30px 60px rgba(0,0,0,0.3), 0 15px 30px rgba(0,0,0,0.2)'
    }}>
        {/* 랩 이동 버튼 */}
        <div className="flex items-center space-x-1">
        <button
          onClick={handlePreviousLap}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
          disabled={currentLap <= 1}
        >
          <SkipBack className="w-3 h-3" />
        </button>
        
        <button
          onClick={handleNextLap}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <SkipForward className="w-3 h-3" />
        </button>
      </div>

      {/* 재생/일시정지 버튼 */}
      <button
        onClick={handlePlayPause}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* 타임라인 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Lap {currentLap}</span>
          <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
        </div>
        
        <input
          type="range"
          min={0}
          max={totalDuration}
          value={currentTime}
          onChange={handleTimelineChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:bg-red-600
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* 재생 속도 */}
      <div className="flex items-center space-x-2 relative">
        <select
          value={playbackSpeed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs
                     focus:outline-none focus:ring-1 focus:ring-red-600 relative z-[9999]"
          style={{ 
            position: 'relative',
            zIndex: 9999
          }}
        >
          {speedOptions.map(speed => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};