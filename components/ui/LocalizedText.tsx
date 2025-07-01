'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getText, LocalizedText as LocalizedTextType } from '@/utils/i18n';

interface LocalizedTextProps {
  text: LocalizedTextType | undefined | null;
  fallback?: string;
  className?: string;
}

export default function LocalizedText({ text, fallback, className }: LocalizedTextProps) {
  const { language } = useLanguage();
  
  return (
    <span className={className}>
      {getText(text, language, fallback)}
    </span>
  );
}