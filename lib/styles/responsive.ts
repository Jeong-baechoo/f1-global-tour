export const getResponsiveStyles = (isMobile: boolean) => ({
  // 텍스트 크기
  textXS: isMobile ? 'text-[10px]' : 'text-xs',
  textSM: isMobile ? 'text-xs' : 'text-sm',
  textBase: isMobile ? 'text-sm' : 'text-base',
  textLG: isMobile ? 'text-base' : 'text-lg',
  textXL: isMobile ? 'text-lg' : 'text-xl',
  text2XL: isMobile ? 'text-xl' : 'text-2xl',
  text3XL: isMobile ? 'text-2xl' : 'text-3xl',
  
  // 패딩
  padding: {
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8',
    x: {
      sm: isMobile ? 'px-3' : 'px-4',
      md: isMobile ? 'px-4' : 'px-6',
      lg: isMobile ? 'px-6' : 'px-8'
    },
    y: {
      sm: isMobile ? 'py-3' : 'py-4',
      md: isMobile ? 'py-4' : 'py-6',
      lg: isMobile ? 'py-6' : 'py-8'
    }
  },
  
  // 마진
  margin: {
    sm: isMobile ? 'm-2' : 'm-3',
    md: isMobile ? 'm-3' : 'm-4',
    lg: isMobile ? 'm-4' : 'm-6',
    x: {
      sm: isMobile ? 'mx-2' : 'mx-3',
      md: isMobile ? 'mx-3' : 'mx-4',
      lg: isMobile ? 'mx-4' : 'mx-6'
    },
    y: {
      sm: isMobile ? 'my-2' : 'my-3',
      md: isMobile ? 'my-3' : 'my-4',
      lg: isMobile ? 'my-4' : 'my-6'
    }
  },
  
  // 갭
  gap: {
    sm: isMobile ? 'gap-2' : 'gap-3',
    md: isMobile ? 'gap-3' : 'gap-4',
    lg: isMobile ? 'gap-4' : 'gap-6'
  },
  
  // 라운딩
  rounded: {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  },
  
  // 버튼 크기
  button: {
    sm: isMobile ? 'py-2 px-3 text-sm' : 'py-2 px-4 text-sm',
    md: isMobile ? 'py-2 px-4 text-sm' : 'py-3 px-4 text-base',
    lg: isMobile ? 'py-3 px-4 text-base' : 'py-3 px-6 text-lg'
  },
  
  // 아이콘 크기
  icon: {
    sm: isMobile ? 'w-4 h-4' : 'w-5 h-5',
    md: isMobile ? 'w-5 h-5' : 'w-6 h-6',
    lg: isMobile ? 'w-6 h-6' : 'w-8 h-8'
  }
});

// 공통 조건부 클래스 적용 헬퍼
export const cn = (...classes: (string | false | null | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};