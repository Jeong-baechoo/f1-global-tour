import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

interface LoadingStateProps {
  className?: string;
}

interface ErrorStateProps {
  className?: string;
  textColor?: string;
}

interface EmptyStateProps {
  className?: string;
}

export function LoadingState({ className = "text-white/70" }: LoadingStateProps) {
  const { language } = useLanguage();
  
  return (
    <div className="flex items-center justify-center h-32">
      <div className={`text-sm ${className}`}>
        {getText({ en: 'Loading...', ko: '로딩 중...' }, language)}
      </div>
    </div>
  );
}

export function ErrorState({ className = "text-sm text-center", textColor = "text-red-400" }: ErrorStateProps) {
  const { language } = useLanguage();
  
  return (
    <div className="flex items-center justify-center h-32">
      <div className={`${textColor} ${className}`}>
        {getText({ en: 'Failed to load data', ko: '데이터 로딩 실패' }, language)}
      </div>
    </div>
  );
}

export function EmptyState({ className = "text-white/70" }: EmptyStateProps) {
  const { language } = useLanguage();
  
  return (
    <div className="flex items-center justify-center h-32">
      <div className={`text-sm ${className}`}>
        {getText({ en: 'No data available', ko: '데이터가 없습니다' }, language)}
      </div>
    </div>
  );
}