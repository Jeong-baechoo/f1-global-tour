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

// 팀 관련 추가 타입들
export interface TeamMarkerData {
  teamId: string;
  name: LocalizedText;
  location: Location;
  color: string;
}