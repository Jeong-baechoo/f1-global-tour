import mapboxgl from 'mapbox-gl';
import { trackStateManager } from '../state/TrackStateManager';
import { useMapStore } from '@/src/features/map/store/useMapStore';

export class DRSAnimationController {
  private static animationDuration = 2000; // 2 seconds

  /**
   * Start DRS sequential signal animation
   */
  static startAnimation(map: mapboxgl.Map, trackId: string, forceEnabled: boolean = false): void {
    // forceEnabled가 true가 아닌 경우에만 스토어 상태 확인
    if (!forceEnabled) {
      const { drsInfoEnabled } = useMapStore.getState();
      if (!drsInfoEnabled) {
        return;
      }
    }
    const startAnimation = () => {
      const startTime = performance.now();

      const animate = () => {
        try {
          const animationInfo = trackStateManager.getDRSAnimation(trackId);

          // Stop if animation is disabled
          if (!animationInfo || !animationInfo.isActive) {
            return;
          }

          if (!map || !map.getLayer) {
            return;
          }

        const elapsed = performance.now() - startTime;
        const totalProgress = (elapsed / this.animationDuration) % 1;

        // Apply animation to all DRS zones
        let drsIndex = 0;
        // const foundLayers = 0; // Not used

        while (true) {
          const drsId = `${trackId}-drs-${drsIndex}`;
          const layerId = `${drsId}-symbols`;

          if (!map || !map.getLayer || !map.getLayer(layerId)) {
            break; // No more DRS zones
          }

          // foundLayers++; // Not used

          // Update symbol layer icon-image with expression
          if (!map || !map.setLayoutProperty) {
            break;
          }
          
          map.setLayoutProperty(layerId, 'icon-image', [
            'case',
            ['<',
              ['%',
                ['+',
                  ['get', 'index'],
                  ['-', 30, ['*', totalProgress, 30]]
                ],
                30
              ],
              7.5
            ], 'chevron-dim',
            ['<',
              ['%',
                ['+',
                  ['get', 'index'],
                  ['-', 30, ['*', totalProgress, 30]]
                ],
                30
              ],
              15
            ], 'chevron-mid',
            ['<',
              ['%',
                ['+',
                  ['get', 'index'],
                  ['-', 30, ['*', totalProgress, 30]]
                ],
                30
              ],
              22.5
            ], 'chevron-bright',
            'chevron-max'
          ]);

          drsIndex++;
        }

          const currentAnimationInfo = trackStateManager.getDRSAnimation(trackId);
          if (currentAnimationInfo && currentAnimationInfo.isActive) {
            currentAnimationInfo.animationId = requestAnimationFrame(animate);
          }
        } catch (error) {
          // Silently handle map errors during page transitions
          if (process.env.NODE_ENV === 'development') {
            console.warn('DRS animation error:', error);
          }
        }
      };

      animate();
    };

    // Register animation info
    const animationInfo = {
      animationId: 0,
      isActive: true,
      restartFunction: startAnimation
    };
    trackStateManager.addDRSAnimation(trackId, animationInfo);

    // Start animation
    startAnimation();
  }

  /**
   * Toggle DRS animation
   */
  static toggleAnimation(trackId: string, enabled: boolean): void {
    const animationInfo = trackStateManager.getDRSAnimation(trackId);

    if (animationInfo) {
      animationInfo.isActive = enabled;
      if (!enabled) {
        // Cancel animation frame
        if (animationInfo.animationId) {
          cancelAnimationFrame(animationInfo.animationId);
          animationInfo.animationId = 0;
        }
      } else {
        // Restart animation
        if (animationInfo.restartFunction) {
          animationInfo.restartFunction();
        }
      }
    }
  }

}