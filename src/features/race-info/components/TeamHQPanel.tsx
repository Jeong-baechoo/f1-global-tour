'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, Car, Trophy, Newspaper, Store } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import { TeamHQData } from '../types';
import { f1ApiService, type F1ConstructorStanding } from '@/src/shared/services/F1ApiService';

// Nationality to country code mapping for flag icons
// noinspection JSNonASCIINames
const NATIONALITY_TO_CODE: Record<string, string> = {
    // Current F1 2025 drivers
    'Dutch': 'nl', 'Japanese': 'jp', 'Monégasque': 'mc', 'British': 'gb',
    'Italian': 'it', 'Australian': 'au', 'Spanish': 'es', 'Canadian': 'ca',
    'French': 'fr', 'Argentine': 'ar', 'Thai': 'th', 'New Zealand': 'nz',
    'German': 'de', 'Brazilian': 'br',
    
    // Additional support
    'Mexican': 'mx', 'Finnish': 'fi', 'Danish': 'dk', 'Chinese': 'cn', 'American': 'us',
    
    // Legacy compatibility
    'Argentinian': 'ar', 'New Zealander': 'nz'
} as const;

// Hardcoded season statistics (F1 API에서 제공하지 않는 데이터)
const SEASON_STATS = {
    podiums: {
        'mclaren': 12, 'ferrari': 4, 'red-bull': 5, 'mercedes': 3, 'sauber': 1, default: 2
    },
    poles: {
        'mclaren': 4, 'ferrari': 2, 'red-bull': 2, 'mercedes': 1, 'sauber': 0, default: 1
    },
    fastestLaps: {
        'mclaren': 5, 'ferrari': 1, 'red-bull': 3, 'mercedes': 2, 'sauber': 0, default: 1
    }
} as const;

// Reusable flag icon component
const FlagIcon: React.FC<{ nationality: string; className?: string }> = ({ 
    nationality, 
    className = "w-6 h-4 rounded-sm overflow-hidden shadow-sm border border-white/20" 
}) => {
    const countryCode = NATIONALITY_TO_CODE[nationality];
    
    if (!countryCode) {
        return <span className="text-lg">🏁</span>;
    }
    
    return (
        <div 
            className={className}
            style={{
                background: `url('https://flagcdn.com/w40/${countryCode}.png') center/cover no-repeat`,
                minWidth: '24px'
            }}
            title={nationality}
        />
    );
};

// Reusable loading spinner component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
    size = 'md', 
    className = '' 
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8', 
        lg: 'w-12 h-12'
    };
    
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`animate-spin ${sizeClasses[size]} border-2 border-white/20 border-t-white rounded-full`} />
        </div>
    );
};

// Statistics card component for reusability
const StatCard: React.FC<{
    value: string | number;
    label: string;
    teamColor: string;
    isLoading: boolean;
}> = ({ value, label, teamColor, isLoading }) => (
    <div className="relative p-6 rounded-xl border transform hover:scale-[1.03] transition-all duration-300 group"
         style={{
           backgroundColor: 'rgba(255, 255, 255, 0.04)',
           borderColor: 'rgba(255, 255, 255, 0.12)',
           boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
         }}>
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
             style={{ background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)` }} />
        <div className="relative z-10 text-center">
            {isLoading ? (
                <LoadingSpinner size="sm" className="h-16" />
            ) : (
                <>
                    <p className="text-5xl font-black mb-3" style={{ color: teamColor }}>
                        {value}
                    </p>
                    <p className="text-sm text-white/70 uppercase tracking-wider font-medium">
                        {label}
                    </p>
                </>
            )}
        </div>
    </div>
);

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
const DriverCard = ({ driver, teamColors }: { driver: unknown, teamColors: unknown }) => {
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
            className="rounded-xl p-6 border hover:bg-white/[0.08] transition-all duration-300 group relative overflow-hidden cursor-pointer"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                transformStyle: 'preserve-3d',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                ...tiltStyle
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="absolute -top-1/2 -left-1/2 w-full h-full bg-radial-gradient from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow"
                style={{ background: `radial-gradient(ellipse at center, ${(teamColors as { primary?: string })?.primary || '#FF1801'}15 0%, transparent 70%)` }}
            />
            <div className="relative flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 shadow-lg group-hover:shadow-xl transition-all flex-shrink-0"
                     style={{
                         borderColor: (teamColors as { primary?: string })?.primary || '#FF1801',
                         boxShadow: `0 4px 16px ${(teamColors as { primary?: string })?.primary || '#FF1801'}30`
                     }}>
                    <Image
                        src={(driver as { image: string }).image}
                        alt={(driver as { name: string }).name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-white font-black leading-tight tracking-tight mb-2 ${
                        (() => {
                            const driverName = (driver as { name: string }).name;
                            // Apply smallest font size for Hulkenberg
                            if (driverName === 'Nico Hulkenberg') {
                                return 'text-base';
                            }
                            // Apply smaller font size for other specific longer driver names
                            if (driverName === 'Max Verstappen' || 
                                driverName === 'Carlos Sainz Jr.' || 
                                driverName === 'Franco Colapinto' || 
                                driverName === 'Lewis Hamilton') {
                                return 'text-lg';
                            }
                            return 'text-xl';
                        })()
                    }`}>{(driver as { name: string }).name}</p>
                    <div className="flex items-center gap-4">
                        <FlagIcon nationality={(driver as { nationality: string }).nationality} />
                        <span className="text-white/60 text-sm font-medium">{(driver as { nationality: string }).nationality}</span>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <span className="text-4xl font-black" style={{ color: (teamColors as { primary?: string })?.primary || '#FF1801' }}>
                        {(driver as { number: number }).number}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const TeamHQPanel: React.FC<TeamHQPanelProps> = ({ data }) => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'car' | 'stats' | 'news'>('car');
    const [championshipData, setChampionshipData] = useState<F1ConstructorStanding | null>(null);
    const [isLoadingChampionship, setIsLoadingChampionship] = useState(false);

    // 챔피언십 데이터 로딩
    useEffect(() => {
        const loadChampionshipData = async () => {
            if (!data?.id) return;
            
            setIsLoadingChampionship(true);
            try {
                const standing = await f1ApiService.getTeamChampionshipData(data.id);
                setChampionshipData(standing);
            } catch (error) {
                console.error('Failed to load championship data:', error);
            } finally {
                setIsLoadingChampionship(false);
            }
        };

        loadChampionshipData();
    }, [data?.id]);

    if (!data) {
        return <div className="p-6 text-white/50">No team data available</div>;
    }

    const teamColor = data.colors?.primary || '#FFFFFF';

    return (
        // 배경을 투명하게 하여 부모의 프로스티드 글라스 효과가 보이도록
        <div className="flex flex-col h-full w-full bg-transparent">
            {/* --- HEADER --- */}
            <div className="px-4 sm:px-6 pt-2 pb-8 space-y-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="relative">
                    <div className="absolute -top-6 -left-6 w-32 h-32 opacity-10"
                         style={{ background: `radial-gradient(ellipse at center, ${teamColor} 0%, transparent 70%)` }} />
                    <div className="relative">
                        {/* Team Name - Hero Typography with Dynamic Sizing */}
                        <h1 className={`font-black tracking-[-0.02em] mb-1 leading-[0.9] transform hover:scale-[1.02] transition-transform duration-300 cursor-default ${
                            (() => {
                                const teamName = getText(data.name, language);
                                const nameLength = teamName.length;
                                if (nameLength <= 6) return 'text-5xl xl:text-6xl';
                                if (nameLength <= 10) return 'text-4xl xl:text-5xl';
                                if (nameLength <= 14) return 'text-3xl xl:text-4xl';
                                return 'text-2xl xl:text-3xl';
                            })()
                        }`}
                            style={{
                                color: teamColor,
                                wordBreak: 'break-word',
                                hyphens: 'auto'
                            }}>
                            {getText(data.name, language)}
                        </h1>

                        {/* Location & Principal - Supporting Info */}
                        <div className="flex flex-col gap-2 mb-4">
                            <p className="text-lg font-medium text-white/80 tracking-wide">
                                {getText(data.headquarters.city, language)}, {getText(data.headquarters.country, language)}
                            </p>
                            {data.principal && (
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-1 rounded-full bg-white/40" />
                                    <p className="text-sm text-white/50 uppercase tracking-[0.15em]">
                                        <span className="text-white/30">{language === 'ko' ? '팀 대표' : 'Principal'}:</span>
                                        <span className="text-white/70 font-medium ml-2">
                                            {typeof data.principal === 'string' ? data.principal : getText(data.principal, language)}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Drivers Section - Enhanced Layout */}
                {data.drivers2025 && data.drivers2025.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60 font-bold">
                                {language === 'ko' ? '2025 드라이버' : '2025 DRIVERS'}
                            </h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent ml-6" />
                        </div>
                        <div className="space-y-6">
                            {data.drivers2025.map((driver, index) => (
                                <div key={index} className="transform hover:scale-[1.01] transition-all duration-300">
                                    <DriverCard driver={driver} teamColors={data.colors} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- CONTENT NAVIGATION --- */}
            <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center justify-between gap-1">
                    <TabButton icon={Car} label={language === 'ko' ? '머신' : 'Machine'} isActive={activeTab === 'car'} onClick={() => setActiveTab('car')} />
                    <TabButton icon={Trophy} label={language === 'ko' ? '챔피언십' : 'Stats'} isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                    <TabButton icon={Newspaper} label={language === 'ko' ? '소식' : 'News'} isActive={activeTab === 'news'} onClick={() => setActiveTab('news')} />
                </div>
            </div>

            {/* --- DYNAMIC CONTENT AREA --- */}
            <div className="flex-1 py-6 overflow-y-auto">
                {activeTab === 'car' && data.car2025 && (
                    <div className="animate-fade-in px-6 space-y-8">
                        {/* Car Title Section - Magazine Hero */}
                        <div className="relative space-y-3">
                            <div className="absolute -top-4 -left-8 w-24 h-24 opacity-20 blur-xl rounded-full"
                                 style={{ backgroundColor: teamColor }} />
                            <div className="relative">
                                <p className="text-sm uppercase tracking-[0.4em] text-white/50 font-semibold mb-2">
                                    {language === 'ko' ? '2025 시즌 머신' : '2025 SEASON MACHINE'}
                                </p>
                                <h2 className={`font-black mb-2 tracking-[-0.02em] leading-[0.9] transform hover:scale-[1.01] transition-transform duration-300 ${
                                    (() => {
                                        const carName = data.car2025.name;
                                        const nameLength = carName.length;
                                        if (nameLength <= 8) return 'text-4xl xl:text-5xl';
                                        if (nameLength <= 12) return 'text-3xl xl:text-4xl';
                                        if (nameLength <= 16) return 'text-2xl xl:text-3xl';
                                        return 'text-xl xl:text-2xl';
                                    })()
                                }`}
                                    style={{ color: teamColor }}>
                                    {data.car2025.name}
                                </h2>
                                <div className="w-20 h-1 rounded-full mt-4" style={{ backgroundColor: teamColor }} />
                            </div>
                        </div>

                        {/* Car Image - Hero Visual */}
                        <div className="relative -mx-6 my-8">
                            <div className="bg-gradient-to-b from-transparent via-[#000000]/30 to-transparent p-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                                <Image
                                    src={data.car2025.image}
                                    alt={data.car2025.name}
                                    width={0}
                                    height={0}
                                    sizes="500px"
                                    className="w-full h-auto object-contain drop-shadow-2xl scale-105 hover:scale-110 transition-transform duration-700"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Car Description - Supporting Content */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white/90 tracking-tight">
                                {language === 'ko' ? '기술 혁신' : 'Technical Innovation'}
                            </h3>
                            <p className="text-base text-white/70 leading-relaxed">
                                {language === 'ko' ?
                                    `${data.car2025.name}은(는) ${getText(data.name, language)} 팀의 2025 시즌을 위한 최신 기술의 집약체입니다. 공기역학적 효율성과 파워 유닛의 성능을 극대화하는 데 초점을 맞추었습니다.` :
                                    `The ${data.car2025.name} is the pinnacle of engineering for the ${getText(data.name, language)} team's 2025 campaign, focusing on aerodynamic efficiency and power unit performance.`
                                }
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && data.championships2025 && (
                    <div className="animate-fade-in px-6 space-y-8">
                        {/* Championship Title */}
                        <div className="space-y-3">
                            <p className="text-sm uppercase tracking-[0.4em] text-white/50 font-semibold">
                                {language === 'ko' ? '2025 시즌 성과' : '2025 SEASON PERFORMANCE'}
                            </p>
                            <h2 className="text-4xl font-black tracking-tight leading-none text-white">
                                {language === 'ko' ? '챔피언십' : 'Championship'}
                            </h2>
                            <div className="w-20 h-1 rounded-full" style={{ backgroundColor: teamColor }} />
                        </div>

                        {/* Championship Standing - Hero Card */}
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

                                <div className="relative z-10 text-center space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-white/60 uppercase tracking-[0.3em] font-medium">
                                            {language === 'ko' ? '컨스트럭터 순위' : 'Constructor Standing'}
                                        </p>
                                        {isLoadingChampionship ? (
                                            <LoadingSpinner size="md" className="h-32" />
                                        ) : (
                                            <>
                                                <p className="text-[120px] lg:text-[140px] font-black leading-none" style={{color: teamColor}}>
                                                    {championshipData?.position || '?'}
                                                </p>
                                                <p className="text-xs text-white/40 uppercase tracking-[0.2em]">
                                                    {language === 'ko' ? '위' : 'st Place'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <div className="pt-4 border-t border-white/20">
                                        {isLoadingChampionship ? (
                                            <LoadingSpinner size="sm" className="h-16" />
                                        ) : (
                                            <>
                                                <p className="text-4xl lg:text-5xl font-black text-white leading-none">
                                                    {championshipData?.points || data.championships2025?.totalPoints || 0}
                                                </p>
                                                <p className="text-sm text-white/60 uppercase tracking-[0.3em] font-medium mt-2">
                                                    {language === 'ko' ? '총 포인트' : 'Championship Points'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Season Statistics - 2x3 Grid Layout */}
                        {/* 
                            NOTE: 챔피언십 데이터 소스 정보
                            - 컨스트럭터 순위 & 총 포인트 & 승리 수: F1 API (https://f1api.dev/api/current/constructors-championship)에서 실시간 데이터
                            - 포디움 수, 폴 포지션 수, 최고 기록 수: F1 API에서 제공하지 않아 하드코딩 유지
                            - 추가 통계 데이터가 필요한 경우 다른 API 소스 연동 필요 (예: Ergast API, OpenF1 API 등)
                        */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-white/90">
                                    {language === 'ko' ? '2025 시즌 성과' : '2025 Season Performance'}
                                </h3>
                                <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <StatCard
                                    value={championshipData?.wins || 0}
                                    label={language === 'ko' ? '승리' : 'Race Wins'}
                                    teamColor={teamColor}
                                    isLoading={isLoadingChampionship}
                                />
                                
                                <StatCard
                                    value={SEASON_STATS.podiums[data.id as keyof typeof SEASON_STATS.podiums] ?? SEASON_STATS.podiums.default}
                                    label={language === 'ko' ? '포디움' : 'Podiums'}
                                    teamColor={teamColor}
                                    isLoading={isLoadingChampionship}
                                />
                                
                                <StatCard
                                    value={SEASON_STATS.poles[data.id as keyof typeof SEASON_STATS.poles] ?? SEASON_STATS.poles.default}
                                    label={language === 'ko' ? '폴 포지션' : 'Pole Positions'}
                                    teamColor={teamColor}
                                    isLoading={isLoadingChampionship}
                                />
                                
                                <StatCard
                                    value={SEASON_STATS.fastestLaps[data.id as keyof typeof SEASON_STATS.fastestLaps] ?? SEASON_STATS.fastestLaps.default}
                                    label={language === 'ko' ? '최고 기록' : 'Fastest Laps'}
                                    teamColor={teamColor}
                                    isLoading={isLoadingChampionship}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'news' && (
                    <div className="animate-fade-in px-6 space-y-8">
                        {/* News Title */}
                        <div className="space-y-3">
                            <p className="text-sm uppercase tracking-[0.4em] text-white/50 font-semibold">
                                {language === 'ko' ? '최신 소식' : 'Latest News'}
                            </p>
                            <h2 className="text-4xl font-black tracking-tight leading-none text-white">
                                {language === 'ko' ? '팀 뉴스' : 'Team Updates'}
                            </h2>
                            <div className="w-20 h-1 rounded-full" style={{ backgroundColor: teamColor }} />
                        </div>

                        {/* Featured News - Hero Article */}
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                 style={{ background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)` }} />
                            <div className="relative p-6 rounded-2xl border hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
                                 style={{
                                   backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                   borderColor: 'rgba(255, 255, 255, 0.15)'
                                 }}>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                                        <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-medium">Breaking</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white leading-tight">
                                        New aerodynamic package tested
                                    </h3>
                                    <p className="text-white/70 leading-relaxed">
                                        Latest wind tunnel developments show promising improvements in downforce efficiency.
                                    </p>
                                    <p className="text-sm text-white/50 font-medium">July 9, 2025</p>
                                </div>
                            </div>
                        </div>

                        {/* Secondary News Items */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
                                 style={{
                                   backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                   borderColor: 'rgba(255, 255, 255, 0.1)'
                                 }}>
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-12 rounded-full mt-1" style={{ backgroundColor: teamColor }} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white/90 mb-1">Driver contract extension announced</h4>
                                        <p className="text-sm text-white/50">July 1, 2025</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
                                 style={{
                                   backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                   borderColor: 'rgba(255, 255, 255, 0.1)'
                                 }}>
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-12 rounded-full mt-1" style={{ backgroundColor: teamColor }} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white/90 mb-1">Technical partnership expansion</h4>
                                        <p className="text-sm text-white/50">June 28, 2025</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- FOOTER LINKS --- */}
            <div className="px-6 py-4 mt-auto border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: teamColor }} />
                        <span className="text-xs text-white/40 uppercase tracking-[0.2em]">
                            {language === 'ko' ? '더 많은 정보' : 'More Info'}
                        </span>
                    </div>
                    <button
                        className="text-white/60 hover:text-white text-sm font-medium flex items-center gap-2 transition-all duration-300 group py-2 px-3 rounded-lg hover:bg-white/[0.03]"
                        style={{
                            '--hover-color': teamColor
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = teamColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                        }}
                    >
                        <Store className="w-3 h-3" />
                        <span>{language === 'ko' ? '팀 스토어' : 'Team Store'}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
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
