'use client';

interface NavigationProps {
  activeTab?: 'map' | 'dash';
  onTabChange?: (tab: 'map' | 'dash') => void;
}

export default function Navigation({ activeTab = 'map', onTabChange }: NavigationProps) {
  const handleTabClick = (tab: 'map' | 'dash') => {
    onTabChange?.(tab);
  };

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex items-center gap-8">
        <button
          onClick={() => handleTabClick('map')}
          className={`text-2xl transition-all duration-300 ${
            activeTab === 'map'
              ? 'font-bold text-white border-b-2 border-white pb-1'
              : 'text-white/70 hover:text-white/90'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => handleTabClick('dash')}
          className={`text-2xl transition-all duration-300 ${
            activeTab === 'dash'
              ? 'font-bold text-white border-b-2 border-white pb-1'
              : 'text-white/70 hover:text-white/90'
          }`}
        >
          Dash
        </button>
      </div>
    </div>
  );
}