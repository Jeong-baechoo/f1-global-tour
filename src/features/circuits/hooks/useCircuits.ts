import { useEffect, useCallback } from 'react';
import { useCircuitStore } from '../store/useCircuitStore';
import { CircuitService } from '../services/CircuitService';

const circuitService = new CircuitService();

export const useCircuits = () => {
  const {
    circuits,
    selectedCircuit,
    isLoading,
    error,
    setCircuits,
    selectCircuit,
    setLoading,
    setError,
  } = useCircuitStore();
  
  const loadCircuits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const circuitsData = await circuitService.getCircuits();
      console.log('Loaded circuits:', circuitsData.length, 'circuits');
      setCircuits(circuitsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load circuits');
      console.error('Error loading circuits:', err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCircuits]);
  
  // Load circuits on mount
  useEffect(() => {
    loadCircuits();
  }, [loadCircuits]);
  
  const selectCircuitById = async (circuitId: string) => {
    try {
      const circuit = await circuitService.getCircuitById(circuitId);
      selectCircuit(circuit);
    } catch (err) {
      console.error('Error selecting circuit:', err);
    }
  };
  
  const getNextRaceCircuit = async () => {
    try {
      const nextRace = await circuitService.getNextRaceCircuit();
      return nextRace;
    } catch (err) {
      console.error('Error getting next race:', err);
      return null;
    }
  };
  
  const getCircuitView = (circuitId: string) => {
    const circuit = circuits.find(c => c.id === circuitId);
    if (!circuit) return null;
    return circuitService.getCircuitView(circuit);
  };
  
  return {
    circuits,
    selectedCircuit,
    isLoading,
    error,
    loadCircuits,
    selectCircuit,
    selectCircuitById,
    getNextRaceCircuit,
    getCircuitView,
  };
};