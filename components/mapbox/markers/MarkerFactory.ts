import mapboxgl from 'mapbox-gl';
import { isMobile } from '@/components/mapbox/utils/device';
import { MarkerData } from '@/components/mapbox/types';

interface BaseMarkerConfig {
  map: mapboxgl.Map;
  coordinates: [number, number];
  markerStyle: {
    width: string;
    height: string;
    mobileWidth: string;
    mobileHeight: string;
    backgroundColor: string;
    borderRadius: string;
    border: string;
    boxShadow?: string;
  };
  onMarkerClick?: (data: MarkerData) => void;
  markerData?: MarkerData;
  customContent: (isMobile: boolean) => string;
  hoverEffects?: {
    scale?: number;
    boxShadow?: string;
  };
  offset?: [number, number];
}

export const createBaseMarker = (config: BaseMarkerConfig): mapboxgl.Marker => {
  const mobile = isMobile();
  const { map, coordinates, markerStyle, onMarkerClick, markerData, customContent, hoverEffects, offset } = config;

  const el = document.createElement('div');
  el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
  el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  el.style.cursor = 'pointer';

  const marker = document.createElement('div');
  marker.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
  marker.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  marker.style.backgroundColor = markerStyle.backgroundColor;
  marker.style.borderRadius = markerStyle.borderRadius;
  marker.style.border = markerStyle.border;
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';
  marker.style.boxShadow = markerStyle.boxShadow || '0 4px 15px rgba(0,0,0,0.3)';
  marker.style.transition = 'all 0.3s ease';
  marker.innerHTML = customContent(mobile);

  el.appendChild(marker);

  // GPU 가속
  el.style.willChange = 'transform';
  marker.style.willChange = 'transform, box-shadow';
  marker.style.transform = 'translateZ(0)';

  // 호버 효과
  const defaultHoverScale = hoverEffects?.scale || 1.1;
  const defaultHoverShadow = hoverEffects?.boxShadow || '0 6px 20px rgba(0,0,0,0.4)';

  el.addEventListener('mouseenter', () => {
    marker.style.transform = `scale(${defaultHoverScale}) translateZ(0)`;
    marker.style.boxShadow = defaultHoverShadow;
  });

  el.addEventListener('mouseleave', () => {
    marker.style.transform = 'scale(1) translateZ(0)';
    marker.style.boxShadow = markerStyle.boxShadow || '0 4px 15px rgba(0,0,0,0.3)';
  });

  // 클릭 이벤트
  if (onMarkerClick && markerData) {
    el.addEventListener('click', () => onMarkerClick(markerData));
  }

  return new mapboxgl.Marker(el, { offset: offset || [0, 0] })
    .setLngLat(coordinates)
    .addTo(map);
};