'use client';

import ConstructorsCard from './ConstructorsCard';
import DriversCard from './DriversCard';
import NewsSection from './NewsSection';
import F1RulesCard from './F1RulesCard';

export default function Dashboard() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden relative">
      {/* 전체 화면 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-blue-500/5 to-green-500/5 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>
      
      {/* 컨텐츠 영역 - 상단바 공간 확보 */}
      <div className="w-full h-full pt-24 px-8 py-8 relative">
        <div className="w-full h-[calc(100vh-128px)] relative">
          {/* 왼쪽 상단 - Constructors Point */}
          <div className="absolute left-0 top-0 w-72 h-[calc(30%-16px)]">
            <ConstructorsCard />
          </div>
          
          {/* 왼쪽 하단 - Drivers Point */}
          <div className="absolute left-0 w-72 h-[calc(70%-16px)]" style={{top: 'calc(30% + 16px)'}}>
            <DriversCard />
          </div>
          
          {/* 오른쪽 상단 - News 섹션 */}
          <div className="absolute left-96 right-0 top-0 h-[calc(66.67%-16px)]">
            <NewsSection />
          </div>
          
          {/* 오른쪽 하단 - F1 Rules 카드 */}
          <div className="absolute left-96 right-0 h-[calc(33.33%-16px)]" style={{top: 'calc(66.67% + 16px)'}}>
            <F1RulesCard />
          </div>
        </div>
      </div>
    </div>
  );
}