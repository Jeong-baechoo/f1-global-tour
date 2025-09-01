'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Settings, Users, Calendar } from 'lucide-react';
import { ReplayControls } from './ReplayControls';
import { DriverSelector } from './DriverSelector';
import { SessionSelector } from './SessionSelector';
import { useReplayStore } from '@/src/features/replay';
import { useReplayEngine } from '@/src/features/replay';
import { cn } from '@/lib/utils';

interface ReplayPanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
  className?: string;
  setIsReplayMode?: (isReplayMode: boolean) => void;
}

type PanelTab = 'session' | 'drivers' | 'controls' | 'settings';

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
    if (activeTab === 'controls') {
      // Controls 패널에 있으면 리플레이 모드 활성화 하고 패널을 닫음
      if (setIsReplayMode) {
        setIsReplayMode(true);
      }
      onCloseAction();
    } else {
      // 다른 탭에 있으면 Controls 패널로 이동
      setActiveTab('controls');
    }
  }, [activeTab, onCloseAction, setIsReplayMode]);

  const tabs = useMemo(() => [
    {
      id: 'session' as PanelTab,
      label: 'Session',
      icon: Calendar,
      disabled: false
    },
    {
      id: 'drivers' as PanelTab,
      label: 'Drivers',
      icon: Users,
      disabled: !currentSession
    },
    {
      id: 'controls' as PanelTab,
      label: 'Controls',
      icon: Settings,
      disabled: !currentSession
    }
  ], [currentSession]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center p-4",
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

        <div className="flex h-[600px]">
          {/* 탭 네비게이션 */}
          <div className="w-48 bg-gray-800 border-r border-gray-700">
            <div className="p-4">
              <div className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDisabled = tab.disabled;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded text-left transition-colors",
                        isActive 
                          ? "bg-red-600 text-white" 
                          : isDisabled
                            ? "text-gray-600 cursor-not-allowed"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              {activeTab === 'session' && (
                <SessionSelector onSessionSelectAction={handleSessionSelect} />
              )}
              
              {activeTab === 'drivers' && currentSession && (
                <DriverSelector />
              )}
              
              {activeTab === 'controls' && currentSession && (
                <div className="space-y-4">
                  <ReplayControls />
                  
                  {/* 추가 컨트롤 옵션들 */}
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white border border-white/10">
                    <h4 className="font-semibold mb-3">Replay Options</h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 bg-gray-700"
                        />
                        <span className="text-sm">Show driver trajectories</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 bg-gray-700"
                        />
                        <span className="text-sm">Follow selected driver</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 bg-gray-700" 
                          defaultChecked
                        />
                        <span className="text-sm">Show lap information</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  {activeTab === 'controls' ? 'Start Replay' : 'Go to Controls'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};