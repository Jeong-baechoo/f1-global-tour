'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Car, Trophy, Newspaper, Store } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import { TeamHQData } from '../types';

// 국가 코드를 국기 이모지로 변환하는 함수
const getFlagEmoji = (nationality: string): string => {
    const flags: { [key: string]: string } = {
        'Spanish': '🇪🇸', 'Canadian': '🇨🇦', 'British': '🇬🇧', 'Mexican': '🇲🇽',
        'Monegasque': '🇲🇨', 'Australian': '🇦🇺', 'Dutch': '🇳🇱', 'Japanese': '🇯🇵',
        'Finnish': '🇫🇮', 'Danish': '🇩🇰', 'German': '🇩🇪', 'Chinese': '🇨🇳',
        'Thai': '🇹🇭', 'American': '🇺🇸', 'French': '�🇷', 'Italian': '🇮🇹',
        'Brazilian': '🇧🇷', 'Argentinian': '🇦🇷', 'New Zealander': '🇳🇿'
    };
    return flags[nationality] || '🏁';
};

interface TeamHQPanelProps {
    data: TeamHQData;
    isMobile: boolean;
    sheetState?: 'closed' | 'peek' | 'half' | 'full';
}

// 탭 버튼 컴포넌트
const TabButton = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all duration-300 text-xs font-medium border ${
            isActive
                ? 'text-white'
                : 'text-white/40 hover:bg-white/[0.05]'
        }`}
        style={{
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            borderColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
        }}
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);

// 선수 카드 컴포넌트 with 3D tilt effect
const DriverCard = ({ driver, teamColors }: { driver: any, teamColors: any }) => {
    const [tiltStyle, setTiltStyle] = React.useState({});
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
            transition: 'transform 0.1s ease-out'
        });
    };
    
    const handleMouseLeave = () => {
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: 'transform 0.3s ease-out'
        });
    };
    
    return (
        <div 
            className="rounded-lg p-3 border hover:bg-white/[0.06] transition-all duration-300 group relative overflow-hidden cursor-pointer"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                transformStyle: 'preserve-3d',
                ...tiltStyle
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="absolute -top-1/2 -left-1/2 w-full h-full bg-radial-gradient from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow"
                style={{ background: `radial-gradient(ellipse at center, ${teamColors?.primary || '#FF1801'}15 0%, transparent 70%)` }}
            />
            <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg group-hover:shadow-xl transition-all flex-shrink-0"
                     style={{ 
                         borderColor: teamColors?.primary || '#FF1801',
                         boxShadow: `0 4px 8px ${teamColors?.primary || '#FF1801'}20`
                     }}>
                    <Image
                        src={driver.image}
                        alt={driver.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1">
                    <p className="text-white font-bold text-base leading-tight">{driver.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">{getFlagEmoji(driver.nationality)}</span>
                        <span className="text-xl font-black" style={{ color: teamColors?.primary || '#FF1801' }}>
                            {driver.number}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TeamHQPanel: React.FC<TeamHQPanelProps> = ({ data }) => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'car' | 'stats' | 'news'>('car');

    if (!data) {
        return <div className="p-6 text-white/50">No team data available</div>;
    }

    const teamColor = data.colors?.primary || '#FFFFFF';

    return (
        // 배경을 투명하게 하여 부모의 프로스티드 글라스 효과가 보이도록
        <div className="flex flex-col h-full w-full bg-transparent">
            {/* --- HEADER --- */}
            <div className="px-6 pt-2 pb-6 space-y-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="relative">
                    <div className="absolute -top-6 -left-6 w-32 h-32 opacity-10"
                         style={{ background: `radial-gradient(ellipse at center, ${teamColor} 0%, transparent 70%)` }} />
                    <div className="relative">
                        <h1 className="text-6xl font-black tracking-tight mb-3 leading-none" style={{ color: teamColor }}>
                            {getText(data.name, language)}
                        </h1>
                        <div className="flex items-center gap-4 mb-3">
                            <p className="text-sm text-white/60">
                                {getText(data.headquarters.city, language)}, {getText(data.headquarters.country, language)}
                            </p>
                            {data.teamPrincipal && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-white/40" />
                                    <p className="text-sm text-white/60">
                                        <span className="text-white/40">{language === 'ko' ? '팀 대표' : 'Principal'}:</span> {getText(data.teamPrincipal, language)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Drivers Section - 나란히 배치 */}
                {data.drivers2025 && data.drivers2025.length > 0 && (
                    <div>
                        <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
                            {language === 'ko' ? '2025 드라이버' : '2025 DRIVERS'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {data.drivers2025.map((driver, index) => (
                                <DriverCard key={index} driver={driver} teamColors={data.colors} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- CONTENT NAVIGATION --- */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center justify-around gap-2">
                    <TabButton icon={Car} label={language === 'ko' ? '머신' : 'Machine'} isActive={activeTab === 'car'} onClick={() => setActiveTab('car')} />
                    <TabButton icon={Trophy} label={language === 'ko' ? '챔피언십' : 'Stats'} isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                    <TabButton icon={Newspaper} label={language === 'ko' ? '소식' : 'News'} isActive={activeTab === 'news'} onClick={() => setActiveTab('news')} />
                </div>
            </div>

            {/* --- DYNAMIC CONTENT AREA --- */}
            <div className="flex-1 py-6 overflow-y-auto">
                {activeTab === 'car' && data.car2025 && (
                    <div className="animate-fade-in">
                        <div className="relative -mx-6 px-6 mb-6">
                            <h2 className="text-5xl font-black mb-3 tracking-tight leading-none" style={{ color: teamColor }}>
                                {data.car2025.name}
                            </h2>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                {language === 'ko' ? '2025 시즌 머신' : '2025 SEASON MACHINE'}
                            </p>
                        </div>
                        {/* 이미지를 더 크고 돋보이게 */}
                        <div className="relative -mx-6 mb-6">
                            <div className="bg-gradient-to-b from-transparent via-[#000000]/20 to-transparent p-8">
                                <Image
                                    src={data.car2025.image}
                                    alt={data.car2025.name}
                                    width={0}
                                    height={0}
                                    sizes="400px"
                                    className="w-full h-auto object-contain drop-shadow-2xl scale-110"
                                    priority
                                />
                            </div>
                        </div>
                        <p className="text-sm text-white/70">
                            {language === 'ko' ?
                                `${data.car2025.name}은(는) ${data.name} 팀의 2025 시즌을 위한 최신 기술의 집약체입니다. 공기역학적 효율성과 파워 유닛의 성능을 극대화하는 데 초점을 맞추었습니다.` :
                                `The ${data.car2025.name} is the pinnacle of engineering for the ${data.name} team's 2025 campaign, focusing on aerodynamic efficiency and power unit performance.`
                            }
                        </p>
                    </div>
                )}

                {activeTab === 'stats' && data.championships2025 && (
                    <div className="animate-fade-in space-y-6">
                        {/* Hero Stat Card - Enhanced Design */}
                        <div className="relative -mx-6 px-6">
                            <div className="relative rounded-2xl p-8 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300"
                                 style={{
                                     background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
                                     border: `1px solid ${teamColor}20`,
                                     boxShadow: `0 20px 40px ${teamColor}10`
                                 }}>
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 opacity-50">
                                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl animate-pulse"
                                         style={{ background: teamColor, opacity: 0.2 }} />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl animate-pulse"
                                         style={{ background: teamColor, opacity: 0.1, animationDelay: '1s' }} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between gap-8">
                                        <div className="space-y-3">
                                            <p className="text-[100px] lg:text-[120px] font-black leading-none" style={{color: teamColor}}>
                                                P{data.id === 'mclaren' ? '1' : data.id === 'ferrari' ? '2' : data.id === 'red-bull' ? '3' : data.id === 'mercedes' ? '4' : '5'}
                                            </p>
                                            <p className="text-sm text-white/60 uppercase tracking-[0.3em] font-medium">Constructor Standing</p>
                                        </div>
                                        <div className="text-right space-y-2 flex-shrink-0">
                                            <p className="text-7xl lg:text-8xl font-black text-white leading-none">{data.championships2025.totalPoints}</p>
                                            <p className="text-sm text-white/60 uppercase tracking-[0.3em] font-medium">Total Points</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Stats - Enhanced Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="relative p-5 rounded-xl border transform hover:scale-[1.05] transition-all duration-300 group"
                                 style={{
                                   backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                   borderColor: 'rgba(255, 255, 255, 0.12)',
                                   boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                 }}>
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                     style={{ background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)` }} />
                                <div className="relative z-10 text-center">
                                    <p className="text-5xl lg:text-6xl font-black mb-2" style={{ color: teamColor }}>
                                        {data.id === 'mclaren' ? '8' : data.id === 'ferrari' ? '6' : data.id === 'red-bull' ? '7' : '2'}
                                    </p>
                                    <p className="text-xs text-white/50 uppercase tracking-wider font-medium">Wins</p>
                                </div>
                            </div>
                            <div className="relative p-5 rounded-xl border transform hover:scale-[1.05] transition-all duration-300 group"
                                 style={{
                                   backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                   borderColor: 'rgba(255, 255, 255, 0.12)',
                                   boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                 }}>
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                     style={{ background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)` }} />
                                <div className="relative z-10 text-center">
                                    <p className="text-5xl lg:text-6xl font-black mb-2" style={{ color: teamColor }}>
                                        {data.id === 'mclaren' ? '21' : data.id === 'ferrari' ? '20' : data.id === 'red-bull' ? '19' : '18'}
                                    </p>
                                    <p className="text-xs text-white/50 uppercase tracking-wider font-medium">Podiums</p>
                                </div>
                            </div>
                            <div className="relative p-5 rounded-xl border transform hover:scale-[1.05] transition-all duration-300 group"
                                 style={{
                                   backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                   borderColor: 'rgba(255, 255, 255, 0.12)',
                                   boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                 }}>
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                     style={{ background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)` }} />
                                <div className="relative z-10 text-center">
                                    <p className="text-5xl lg:text-6xl font-black mb-2" style={{ color: teamColor }}>
                                        {data.id === 'mclaren' ? '5' : data.id === 'ferrari' ? '4' : data.id === 'red-bull' ? '3' : '1'}
                                    </p>
                                    <p className="text-xs text-white/50 uppercase tracking-wider font-medium">Poles</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'news' && (
                    <div className="animate-fade-in space-y-3 text-sm">
                        <a href="#" className="block p-3 rounded-lg border hover:bg-white/[0.05] transition-all duration-300"
                           style={{
                             backgroundColor: 'rgba(255, 255, 255, 0.03)',
                             borderColor: 'rgba(255, 255, 255, 0.1)'
                           }}>
                            <p className="font-medium text-white/90">New aerodynamic package tested</p>
                            <p className="text-xs text-white/50">July 9, 2025</p>
                        </a>
                        <a href="#" className="block p-3 rounded-lg border hover:bg-white/[0.05] transition-all duration-300"
                           style={{
                             backgroundColor: 'rgba(255, 255, 255, 0.03)',
                             borderColor: 'rgba(255, 255, 255, 0.1)'
                           }}>
                            <p className="font-medium text-white/90">Driver contract extension announced</p>
                            <p className="text-xs text-white/50">July 1, 2025</p>
                        </a>
                    </div>
                )}
            </div>

            {/* --- FOOTER ACTION --- */}
            <div className="p-6 mt-auto border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <button
                    className="w-full text-white/90 font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:text-white flex items-center justify-center gap-3 uppercase tracking-wider group border transform hover:scale-[1.02]"
                    style={{
                        backgroundColor: `${teamColor}10`,
                        borderColor: `${teamColor}30`,
                        boxShadow: `0 4px 16px ${teamColor}10`
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${teamColor}20`;
                        e.currentTarget.style.borderColor = `${teamColor}50`;
                        e.currentTarget.style.boxShadow = `0 8px 24px ${teamColor}20`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${teamColor}10`;
                        e.currentTarget.style.borderColor = `${teamColor}30`;
                        e.currentTarget.style.boxShadow = `0 4px 16px ${teamColor}10`;
                    }}
                >
                    <Store className="w-4 h-4" />
                    <span className="font-bold">{language === 'ko' ? '공식 팀 스토어' : 'Official Team Store'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
        </div>
    );
};

// Tailwind CSS를 위한 애니메이션 키프레임 (tailwind.config.js에 추가)
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}/
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
animation: {
  'fade-in': 'fadeIn 0.5s ease-out forwards',
  'shimmer': 'shimmer 2s infinite linear',
  'spin-slow': 'spin 10s linear infinite',
}
*/
