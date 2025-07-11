import { create } from 'zustand';
import { CircuitsState, TrackData } from '../types';

const initialState = {
  circuits: [],
  selectedCircuit: null,
  circuitMarkers: [],
  trackData: new Map<string, TrackData>(),
  isLoading: false,
  error: null,
  animatingCircuitId: null,
};

export const useCircuitStore = create<CircuitsState>((set) => ({
      ...initialState,
      
      setCircuits: (circuits) => set({ circuits }),
      
      selectCircuit: (circuit) => set({ selectedCircuit: circuit }),
      
      setCircuitMarkers: (markers) => set({ circuitMarkers: markers }),
      
      setTrackData: (circuitId, data) => set((state) => {
        const newTrackData = new Map(state.trackData);
        newTrackData.set(circuitId, data);
        return { trackData: newTrackData };
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setAnimatingCircuitId: (circuitId) => set({ animatingCircuitId: circuitId }),
      
      reset: () => set(initialState),
}));