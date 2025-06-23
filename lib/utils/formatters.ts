/**
 * 위치 정보를 문자열로 포맷팅
 */
export const formatLocation = (location: string | { city: string; country: string } | undefined): string => {
  if (!location) return '';
  
  if (typeof location === 'string') {
    return location;
  }
  
  const { city = '', country = '' } = location;
  return [city, country].filter(Boolean).join(', ');
};

/**
 * 날짜를 읽기 쉬운 형식으로 포맷팅
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
};

/**
 * 시간을 읽기 쉬운 형식으로 포맷팅
 */
export const formatTime = (time: string | Date, includeSeconds = false): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  };
  
  return new Date(time).toLocaleTimeString('en-US', options);
};

/**
 * 숫자를 천 단위 구분자와 함께 포맷팅
 */
export const formatNumber = (num: number, decimals = 0): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 거리를 km 단위로 포맷팅
 */
export const formatDistance = (km: number): string => {
  return `${formatNumber(km, 3)} km`;
};

/**
 * 랩 타임을 포맷팅 (1:23.456 형식)
 */
export const formatLapTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`;
};

/**
 * 카운트다운 시간 포맷팅
 */
export const formatCountdown = (ms: number): { days: number; hours: number; minutes: number; seconds: number } => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
};

/**
 * 팀 이름을 짧은 형식으로 변환 (예: Mercedes-AMG Petronas F1 Team -> Mercedes)
 */
export const formatTeamNameShort = (fullName: string): string => {
  const shortNames: Record<string, string> = {
    'Mercedes-AMG Petronas F1 Team': 'Mercedes',
    'Oracle Red Bull Racing': 'Red Bull',
    'Scuderia Ferrari': 'Ferrari',
    'McLaren F1 Team': 'McLaren',
    'Aston Martin Aramco F1 Team': 'Aston Martin',
    'Alpine F1 Team': 'Alpine',
    'Williams Racing': 'Williams',
    'Visa Cash App RB F1 Team': 'RB',
    'Kick Sauber F1 Team': 'Sauber',
    'MoneyGram Haas F1 Team': 'Haas'
  };
  
  return shortNames[fullName] || fullName;
};

/**
 * 서킷 이름을 짧은 형식으로 변환
 */
export const formatCircuitNameShort = (grandPrix: string): string => {
  return grandPrix.replace(' Grand Prix', '').replace(' GP', '');
};