'use client';

import ConstructorsCard from './ConstructorsCard';
import DriversCard from './DriversCard';
import NewsSection from './NewsSection';
import F1RulesCard from './F1RulesCard';

// 레이아웃 상수
const LAYOUT_CONSTANTS = {
  topPadding: 'pt-24',
  containerPadding: 'px-4 py-4',
  containerHeight: 'h-[calc(100vh-128px)]',
  gap: 'gap-4',
  leftColumn: {
    width: 'w-80 min-w-80 max-w-80',
    topHeight: 'h-[30%] min-h-[200px]',
    bottomHeight: 'flex-1 min-h-[300px]'
  },
  rightColumn: {
    topHeight: 'flex-1 h-2/3 min-h-[400px]',
    bottomHeight: 'h-1/3 min-h-[200px]'
  }
} as const;

const LeftColumn = () => (
  <div className={`flex flex-col ${LAYOUT_CONSTANTS.gap} ${LAYOUT_CONSTANTS.leftColumn.width}`}>
    <div className={LAYOUT_CONSTANTS.leftColumn.topHeight}>
      <ConstructorsCard />
    </div>
    <div className={LAYOUT_CONSTANTS.leftColumn.bottomHeight}>
      <DriversCard />
    </div>
  </div>
);

const RightColumn = () => (
  <div className={`flex flex-col ${LAYOUT_CONSTANTS.gap} flex-1 min-w-0`}>
    <div className={LAYOUT_CONSTANTS.rightColumn.topHeight}>
      <NewsSection />
    </div>
    <div className={LAYOUT_CONSTANTS.rightColumn.bottomHeight}>
      <F1RulesCard />
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <div className={`w-full h-full ${LAYOUT_CONSTANTS.topPadding} ${LAYOUT_CONSTANTS.containerPadding} overflow-hidden`}>
        <div className={`w-full ${LAYOUT_CONSTANTS.containerHeight} flex ${LAYOUT_CONSTANTS.gap} overflow-hidden`}>
          <LeftColumn />
          <RightColumn />
        </div>
      </div>
    </div>
  );
}