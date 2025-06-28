'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText, type MultiLanguageText } from '@/utils/i18n';

interface LocalizedTextProps {
  text: string | MultiLanguageText;
  fallback?: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export default function LocalizedText({ 
  text, 
  fallback = '', 
  className = '', 
  as: Component = 'span' 
}: LocalizedTextProps) {
  const { language } = useLanguage();
  
  const displayText = typeof text === 'string' ? text : getText(text, language, fallback);
  
  return (
    <Component className={className}>
      {displayText}
    </Component>
  );
}