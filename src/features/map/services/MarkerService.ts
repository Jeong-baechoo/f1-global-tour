import mapboxgl from 'mapbox-gl';

export interface MarkerOptions {
  id: string;
  coordinates: [number, number];
  element?: HTMLElement;
  anchor?: mapboxgl.Anchor;
  offset?: mapboxgl.PointLike;
  color?: string;
  draggable?: boolean;
  rotation?: number;
  rotationAlignment?: 'map' | 'viewport' | 'auto';
  pitchAlignment?: 'map' | 'viewport' | 'auto';
}

export interface MarkerWithCleanup {
  marker: mapboxgl.Marker;
  cleanup: () => void;
}

export class MarkerService {
  private markers: Map<string, MarkerWithCleanup> = new Map();
  private map: mapboxgl.Map | null = null;

  /**
   * Set map instance
   */
  public setMap(map: mapboxgl.Map): void {
    this.map = map;
  }

  /**
   * Create a marker
   */
  public createMarker(options: MarkerOptions): mapboxgl.Marker {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    // Remove existing marker with same ID if exists
    if (this.markers.has(options.id)) {
      this.removeMarker(options.id);
    }

    // Create marker options
    const markerOptions: mapboxgl.MarkerOptions = {
      anchor: options.anchor || 'center',
      draggable: options.draggable || false,
    };

    if (options.element) {
      markerOptions.element = options.element;
    }
    if (options.offset) {
      markerOptions.offset = options.offset;
    }
    if (options.color) {
      markerOptions.color = options.color;
    }
    if (options.rotation !== undefined) {
      markerOptions.rotation = options.rotation;
    }
    if (options.rotationAlignment) {
      markerOptions.rotationAlignment = options.rotationAlignment;
    }
    if (options.pitchAlignment) {
      markerOptions.pitchAlignment = options.pitchAlignment;
    }

    // Create marker
    const marker = new mapboxgl.Marker(markerOptions)
      .setLngLat(options.coordinates)
      .addTo(this.map);

    // Create cleanup function
    const cleanup = () => {
      marker.remove();
      if (options.element) {
        // Clean up any event listeners on the element
        const newElement = options.element.cloneNode(true) as HTMLElement;
        options.element.parentNode?.replaceChild(newElement, options.element);
      }
    };

    // Store marker with cleanup
    this.markers.set(options.id, { marker, cleanup });

    return marker;
  }

  /**
   * Create marker with custom HTML element
   */
  public createCustomMarker(
    id: string,
    coordinates: [number, number],
    createElementFn: () => HTMLElement,
    options?: Partial<MarkerOptions>
  ): mapboxgl.Marker {
    const element = createElementFn();
    
    return this.createMarker({
      id,
      coordinates,
      element,
      ...options
    });
  }

  /**
   * Get marker by ID
   */
  public getMarker(id: string): mapboxgl.Marker | null {
    const markerData = this.markers.get(id);
    return markerData?.marker || null;
  }

  /**
   * Update marker position
   */
  public updateMarkerPosition(id: string, coordinates: [number, number]): void {
    const markerData = this.markers.get(id);
    if (markerData) {
      markerData.marker.setLngLat(coordinates);
    }
  }

  /**
   * Update marker rotation
   */
  public updateMarkerRotation(id: string, rotation: number): void {
    const markerData = this.markers.get(id);
    if (markerData) {
      markerData.marker.setRotation(rotation);
    }
  }

  /**
   * Remove a marker
   */
  public removeMarker(id: string): void {
    const markerData = this.markers.get(id);
    if (markerData) {
      markerData.cleanup();
      this.markers.delete(id);
    }
  }

  /**
   * Remove all markers
   */
  public removeAllMarkers(): void {
    this.markers.forEach((markerData) => {
      markerData.cleanup();
    });
    this.markers.clear();
  }

  /**
   * Check if marker exists
   */
  public hasMarker(id: string): boolean {
    return this.markers.has(id);
  }

  /**
   * Get all marker IDs
   */
  public getMarkerIds(): string[] {
    return Array.from(this.markers.keys());
  }

  /**
   * Show/hide marker
   */
  public toggleMarkerVisibility(id: string, visible: boolean): void {
    const markerData = this.markers.get(id);
    if (markerData) {
      const element = markerData.marker.getElement();
      if (element) {
        element.style.display = visible ? '' : 'none';
      }
    }
  }

  /**
   * Add click handler to marker
   */
  public addMarkerClickHandler(id: string, handler: (e: Event) => void): void {
    const markerData = this.markers.get(id);
    if (markerData) {
      const element = markerData.marker.getElement();
      if (element) {
        element.addEventListener('click', handler);
      }
    }
  }

  /**
   * Remove click handler from marker
   */
  public removeMarkerClickHandler(id: string, handler: (e: Event) => void): void {
    const markerData = this.markers.get(id);
    if (markerData) {
      const element = markerData.marker.getElement();
      if (element) {
        element.removeEventListener('click', handler);
      }
    }
  }

  /**
   * Create marker with popup
   */
  public createMarkerWithPopup(
    options: MarkerOptions,
    popupContent: string | HTMLElement,
    popupOptions?: mapboxgl.PopupOptions
  ): mapboxgl.Marker {
    const marker = this.createMarker(options);
    
    const popup = new mapboxgl.Popup(popupOptions)
      .setHTML(typeof popupContent === 'string' ? popupContent : popupContent.outerHTML);
    
    marker.setPopup(popup);
    
    return marker;
  }

  /**
   * Batch create markers
   */
  public createMarkers(markerOptions: MarkerOptions[]): Map<string, mapboxgl.Marker> {
    const createdMarkers = new Map<string, mapboxgl.Marker>();
    
    markerOptions.forEach((options) => {
      const marker = this.createMarker(options);
      createdMarkers.set(options.id, marker);
    });
    
    return createdMarkers;
  }

  /**
   * Filter markers by predicate
   */
  public filterMarkers(predicate: (id: string, marker: mapboxgl.Marker) => boolean): string[] {
    const matchingIds: string[] = [];
    
    this.markers.forEach((markerData, id) => {
      if (predicate(id, markerData.marker)) {
        matchingIds.push(id);
      }
    });
    
    return matchingIds;
  }

  /**
   * Get markers within bounds
   */
  public getMarkersInBounds(bounds: mapboxgl.LngLatBounds): string[] {
    return this.filterMarkers((id, marker) => {
      const lngLat = marker.getLngLat();
      return bounds.contains(lngLat);
    });
  }

  /**
   * Clean up all markers and references
   */
  public destroy(): void {
    this.removeAllMarkers();
    this.map = null;
  }
}