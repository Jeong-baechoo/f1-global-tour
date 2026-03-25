'use client';

import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { SessionSelector } from './SessionSelector';
import { useReplayStore, useReplayEngine } from '@/src/features/replay';
import ReplayErrorHandler from '../services/ReplayErrorHandler';
import { cn } from '@/lib/utils';

interface ReplayPanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
  className?: string;
  setIsReplayMode?: (isReplayMode: boolean) => void;
}

export const ReplayPanel: React.FC<ReplayPanelProps> = ({
  isOpen,
  onCloseAction,
  className,
  setIsReplayMode
}) => {
  const currentSession = useReplayStore(state => state.currentSession);

  useReplayEngine();

  const handleStartReplay = useCallback(() => {
    try {
      setIsReplayMode?.(true);
      onCloseAction();
    } catch (error) {
      ReplayErrorHandler.handleUserInteractionError(
        error instanceof Error ? error : new Error('Failed to start replay'),
        {
          currentSession: currentSession?.sessionKey,
          operation: 'startReplay'
        }
      );
    }
  }, [onCloseAction, setIsReplayMode, currentSession]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4",
      "bg-black/50 backdrop-blur-sm",
      className
    )}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">F1 Race Replay</h2>
          <button
            onClick={onCloseAction}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 세션 정보 */}
        {currentSession && (
          <div className="px-3 sm:px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-300">
              <span className="font-medium">{currentSession.sessionName}</span>
              <span className="mx-1 sm:mx-2 hidden sm:inline">•</span>
              <span className="hidden sm:inline">{currentSession.circuitShortName}</span>
              <span className="mx-1 sm:mx-2 hidden sm:inline">•</span>
              <span className="ml-2 sm:ml-0">{currentSession.year}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto min-h-0">
          <div className="p-3 sm:p-4">
            <SessionSelector />
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
              {currentSession ? (
                `Session loaded: ${currentSession.sessionName}`
              ) : (
                'Select a session to start replay'
              )}
            </div>

            <div className="flex space-x-2 justify-center sm:justify-end">
              <button
                onClick={onCloseAction}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>

              {currentSession && (
                <button
                  onClick={handleStartReplay}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                >
                  Start Replay
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
