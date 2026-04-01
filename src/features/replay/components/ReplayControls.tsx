'use client';

import React, { useCallback } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import {
  useReplayIsPlaying,
  useReplayCurrentTime,
  useReplayTotalDuration,
  useReplayPlaybackSpeed,
  useReplayCurrentLap,
  useReplayActions
} from '@/src/features/replay';
import { cn } from '@/lib/utils';
import { formatReplayTime, PLAYBACK_SPEED_OPTIONS } from '../utils/format';

interface ReplayControlsProps {
  className?: string;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({ className }) => {
  const isPlaying = useReplayIsPlaying();
  const currentTime = useReplayCurrentTime();
  const totalDuration = useReplayTotalDuration();
  const playbackSpeed = useReplayPlaybackSpeed();
  const currentLap = useReplayCurrentLap();

  const {
    play,
    pause,
    stop,
    setPlaybackSpeed,
    seekTo,
    jumpToLap
  } = useReplayActions();

  const handlePlayPause = useCallback(() => {
    if (isPlaying) { pause(); } else { play(); }
  }, [isPlaying, play, pause]);

  const handleTimelineChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= totalDuration) {
      seekTo(newTime);
    }
  }, [seekTo, totalDuration]);

  const handlePreviousLap = useCallback(() => {
    jumpToLap(Math.max(1, currentLap - 1));
  }, [currentLap, jumpToLap]);

  const handleNextLap = useCallback(() => {
    jumpToLap(currentLap + 1);
  }, [currentLap, jumpToLap]);

  return (
    <div className={cn(
      "bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white",
      "border border-white/10",
      className
    )}>
      {/* 타임라인 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Lap {currentLap}</span>
          <span>{formatReplayTime(currentTime)} / {formatReplayTime(totalDuration)}</span>
        </div>

        <input
          type="range"
          min={0}
          max={totalDuration}
          value={currentTime}
          onChange={handleTimelineChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-red-600
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex items-center justify-between">
        {/* 랩 이동 버튼 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousLap}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={currentLap <= 1}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextLap}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* 재생/일시정지/정지 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={stop}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <Square className="w-6 h-6" />
          </button>
        </div>

        {/* 재생 속도 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {PLAYBACK_SPEED_OPTIONS.map(speed => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
