'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

// F1 뉴스 타입 정의
interface NewsItem {
  id: number;
  title: string;
  image: string;
}

// F1 뉴스 데이터 상수
const F1_NEWS_TOPICS = [
  'Max Verstappen dominates qualifying',
  'Hamilton returns to podium form',
  'Ferrari upgrades show promise',
  'McLaren battles for constructor points',
  'Red Bull reveals new aerodynamics',
  'Mercedes struggling with pace',
  'Alonso extends contract with Aston Martin',
  'Rookie driver impresses in practice',
  'Safety car deployment changes race',
  'DRS zone modifications announced',
  'Tire strategy proves crucial',
  'Weather forecast affects race plans'
] as const;

// 그리드 레이아웃 상수
const GRID_CONFIG = {
  columns: 'grid-cols-3',
  rows: 'grid-rows-3',
  gap: 'gap-3',
  itemCount: 9
} as const;

// 뉴스 데이터 생성 함수
const generateNewsData = (count: number = GRID_CONFIG.itemCount): NewsItem[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: F1_NEWS_TOPICS[index] || `F1 News Update ${index + 1}`,
    image: '/placeholder-f1-news.jpg'
  }));
};

// 뉴스 아이템 컴포넌트
const NewsItem = ({ 
  news, 
  className = ""
}: { 
  news: NewsItem; 
  className?: string;
}) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group hover:border-[#ff1801]/40 hover:bg-[#ff1801]/5 transition-all duration-300 cursor-pointer h-full flex flex-col ${className}`}>
    {/* 썸네일 이미지 */}
    <div className="relative flex-1 bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center">
      <div className="text-white/40 text-xs font-medium">F1 NEWS</div>
      <div className="absolute top-2 right-2 w-2 h-2 bg-[#ff1801] rounded-full animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
    </div>
    
    {/* 제목 */}
    <div className="p-3 flex-shrink-0">
      <h3 className="text-white text-sm font-medium leading-tight group-hover:text-[#ff1801]/90 transition-colors line-clamp-2">
        {news.title}
      </h3>
    </div>
  </div>
);

export default function NewsSection() {
  const { language } = useLanguage();
  const newsData = generateNewsData();

  return (
    <div className="flex flex-col w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#ff1801]/30 rounded-2xl p-6 shadow-lg transition-all duration-300">
      <div className="mb-4 pb-3 border-b border-[#ff1801]/30">
        <h2 className="text-white text-lg font-semibold tracking-wide bg-gradient-to-r from-[#ff1801] to-[#ff1801]/80 bg-clip-text text-transparent">
          {getText({ en: 'Latest News', ko: '최신 뉴스' }, language)}
        </h2>
      </div>
      <div className="relative w-full flex-1 overflow-hidden">
        <div className={`grid ${GRID_CONFIG.columns} ${GRID_CONFIG.rows} ${GRID_CONFIG.gap} h-full overflow-hidden`}>
          {newsData.map((news) => (
            <NewsItem key={news.id} news={news} />
          ))}
        </div>
      </div>
    </div>
  );
}