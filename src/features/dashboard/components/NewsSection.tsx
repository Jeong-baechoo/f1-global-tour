'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

// 뉴스 데이터 생성 함수
const generateNewsData = (count: number = 20) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `temp news${index + 1}`,
    image: '/placeholder-f1-news.jpg'
  }));
};

// 뉴스 아이템 컴포넌트
const NewsItem = ({ 
  news, 
  className,
  imageSize = "w-52 h-36"
}: { 
  news: { id: number; title: string; image: string }; 
  className?: string;
  imageSize?: string;
}) => (
  <div className={`flex flex-col items-center flex-shrink-0 select-none group ${className}`}>
    <div className={`relative bg-gray-800/50 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden mb-3 group-hover:border-white/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/20 ${imageSize}`}>
      <div className="w-full h-full bg-gradient-to-br from-gray-600/80 to-gray-800/80 flex items-center justify-center">
        <div className="text-white text-base font-semibold">F1 News Image</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
    </div>
    <h3 className="text-white text-center font-medium text-base leading-tight group-hover:text-gray-200 transition-colors">
      {news.title}
    </h3>
  </div>
);

export default function NewsSection() {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isSingleRow, setIsSingleRow] = useState(false);
  
  const newsData = generateNewsData(20);

  // 스크롤 상태 확인 함수
  const checkScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // 컨테이너 높이에 따른 행 수 결정
  const checkLayout = useCallback(() => {
    // 뉴스 섹션의 실제 사용 가능한 높이 계산 (전체 높이의 2/3에서 제목과 패딩 제외)
    const availableHeight = (window.innerHeight - 96) * (2/3) - 60;
    // 280px 미만이면 1줄, 이상이면 2줄
    setIsSingleRow(availableHeight < 280);
  }, []);

  // 컴포넌트 마운트 시 스크롤 상태 및 레이아웃 확인
  useEffect(() => {
    checkScrollState();
    checkLayout();
    
    const handleResize = () => {
      checkScrollState();
      checkLayout();
    };
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollState, checkLayout]);

  // 드래그 스크롤 핸들러들
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    checkScrollState();
  }, [isDragging, startX, scrollLeft, checkScrollState]);

  return (
    <div className="flex flex-col items-center w-full h-full bg-transparent p-6">
      <div className="mb-3 pb-3 border-b border-white/20 w-full">
        <h2 className="text-white text-3xl font-bold text-center tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {getText({ en: 'News', ko: '뉴스' }, language)}
        </h2>
      </div>
      <div className="relative w-full flex-1">
        <div 
          ref={scrollRef}
          className={`w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide px-4 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            maskImage: canScrollLeft && canScrollRight 
              ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
              : canScrollLeft 
                ? 'linear-gradient(to right, transparent 0%, black 5%, black 100%)'
                : canScrollRight
                  ? 'linear-gradient(to right, black 0%, black 95%, transparent 100%)'
                  : 'none',
            WebkitMaskImage: canScrollLeft && canScrollRight 
              ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
              : canScrollLeft 
                ? 'linear-gradient(to right, transparent 0%, black 5%, black 100%)'
                : canScrollRight
                  ? 'linear-gradient(to right, black 0%, black 95%, transparent 100%)'
                  : 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {isSingleRow ? (
            /* 1줄 레이아웃 */
            <div className="flex gap-6 h-full items-center">
              {newsData.map((news) => (
                <NewsItem key={news.id} news={news} className="w-60" />
              ))}
            </div>
          ) : (
            /* 2줄 레이아웃 - 각 줄에 10개씩 */
            <div className="flex flex-col gap-6 h-full">
              {/* 첫 번째 줄 - 10개 */}
              <div className="flex gap-6">
                {newsData.slice(0, 10).map((news) => (
                  <NewsItem key={news.id} news={news} className="w-64" imageSize="w-60 h-40" />
                ))}
              </div>
              {/* 두 번째 줄 - 10개 */}
              <div className="flex gap-6">
                {newsData.slice(10, 20).map((news) => (
                  <NewsItem key={news.id} news={news} className="w-64" imageSize="w-60 h-40" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}