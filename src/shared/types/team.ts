import type { LocalizedText } from '@/utils/i18n';
import { Location, Colors, Driver, Car, Championship } from './common';

export interface Team {
  id: string;
  name: LocalizedText;
  fullName: string;
  description: string;
  teamPrincipal: LocalizedText;
  foundingYear: number;
  headquarters: Location;
  colors: Colors;
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: Championship;
}

// 팀 관련 추가 타입들 - 통합 마커 타입으로 대체됨
// @deprecated Use TeamMarkerData from '@/src/shared/types/marker' instead