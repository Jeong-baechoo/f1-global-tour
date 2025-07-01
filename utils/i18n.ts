import { type Language } from '@/contexts/LanguageContext';

export type { Language };
export type LocalizedText = string | { [key in Language]?: string };

/**
 * 다국어 텍스트를 현재 언어에 맞게 반환하는 함수
 * @param text - 단일 문자열 또는 언어별 객체
 * @param language - 현재 언어 설정
 * @param fallback - 기본값 (선택사항)
 * @returns 현재 언어에 맞는 텍스트
 */
export function getText(
  text: LocalizedText | undefined | null, 
  language: Language, 
  fallback?: string
): string {
  if (!text) {
    return fallback || '';
  }

  if (typeof text === 'string') {
    return text;
  }

  // 객체인 경우 현재 언어의 텍스트를 반환
  if (typeof text === 'object') {
    return text[language] || text.en || text.ko || fallback || '';
  }

  return fallback || '';
}