'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Settings, Users, Calendar } from 'lucide-react';
import { ReplayControls } from './ReplayControls';
import { DriverSelector } from './DriverSelector';
import { SessionSelector } from './SessionSelector';
import { useReplayStore } from '@/src/features/replay';
import { useReplayEngine } from '@/src/features/replay';
import ReplayErrorHandler from '../services/ReplayErrorHandler';
import { cn } from '@/lib/utils';

interface ReplayPanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
  className?: string;
  setIsReplayMode?: (isReplayMode: boolean) => void;
}

type PanelTab = 'session' | 'drivers';

export const ReplayPanel: React.FC<ReplayPanelProps> = ({
  isOpen, 
  onCloseAction,
  className,
  setIsReplayMode
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('session');
  const currentSession = useReplayStore(state => state.currentSession);
  
  // ReplayEngine 훅 사용
  useReplayEngine();

  // 세션 상태에 따른 탭 전환
  useEffect(() => {
    if (currentSession) {
      // 세션이 선택되면 자동으로 드라이버 탭으로 전환
      setActiveTab('drivers');
    } else {
      // 세션이 없으면 session 탭으로 돌아가기
      setActiveTab('session');
    }
  }, [currentSession]);

  const handleSessionSelect = useCallback(() => {
    // useEffect에서 자동으로 탭 전환되므로 여기서는 추가 로직 없음
  }, []);

  const handleStartReplay = useCallback(() => {
    try {
      // Session 선택 시 바로 리플레이 모드 활성화 (Drivers 섹션 건너뛰기)
      if (setIsReplayMode) {
        setIsReplayMode(true);
      }
      onCloseAction();
      
      // // 기존 로직 (주석처리)
      // if (activeTab === 'drivers') {
      //   // Drivers 패널에 있으면 리플레이 모드 활성화 하고 패널을 닫음
      //   if (setIsReplayMode) {
      //     setIsReplayMode(true);
      //   }
      //   onCloseAction();
      // } else {
      //   // Session 탭에 있으면 Drivers 패널로 이동
      //   setActiveTab('drivers');
      // }
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

  const tabs = useMemo(() => [
    {
      id: 'session' as PanelTab,
      label: 'Session',
      icon: Calendar,
      disabled: false
    }
    // // Drivers 탭 임시 비활성화 (주석처리)
    // {
    //   id: 'drivers' as PanelTab,
    //   label: 'Drivers',
    //   icon: Users,
    //   disabled: !currentSession
    // }
  ], []);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[60] flex items-center justify-center p-4",
      "bg-black/50 backdrop-blur-sm",
      className
    )}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">F1 Race Replay</h2>
          <button
            onClick={onCloseAction}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 세션 정보 */}
        {currentSession && (
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="text-sm text-gray-300">
              <span className="font-medium">{currentSession.sessionName}</span>
              <span className="mx-2">•</span>
              <span>{currentSession.circuitShortName}</span>
              <span className="mx-2">•</span>
              <span>{currentSession.year}</span>
            </div>
          </div>
        )}

        {/* 컨텐츠 영역 - 탭 네비게이션 임시 제거 */}
        <div className="h-[600px] overflow-auto">
          <div className="p-4">
            {/* SessionSelector 항상 표시 */}
            <SessionSelector onSessionSelectAction={handleSessionSelect} />
            
            {/* Drivers 섹션 임시 비활성화 (주석처리) */}
            {/* {activeTab === 'drivers' && currentSession && (
              <DriverSelector />
            )} */}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {currentSession ? (
                `Session loaded: ${currentSession.sessionName}`
              ) : (
                'Select a session to start replay'
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onCloseAction}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
              
              {currentSession && (
                <button
                  onClick={handleStartReplay}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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