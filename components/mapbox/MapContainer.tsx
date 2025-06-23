'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Team, Circuit } from '@/types/f1';
import teams from '@/data/teams.json';
import circuits from '@/data/circuits.json';

// Replace with your actual Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [10, 30],
      zoom: 2.5,
      pitch: 45,
      bearing: 0,
      projection: 'globe'
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Add atmosphere effect
    map.current.on('style.load', () => {
      map.current!.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      });
    });

    // Add team markers
    teams.teams.forEach((team) => {
      const el = document.createElement('div');
      el.className = 'team-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundImage = `url('/markers/helmet.svg')`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundColor = team.colors.primary;
      el.style.borderRadius = '50%';
      el.style.border = `3px solid ${team.colors.secondary}`;
      el.style.padding = '4px';

      new mapboxgl.Marker(el)
        .setLngLat([team.headquarters.lng, team.headquarters.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        flyToLocation(team.headquarters.lng, team.headquarters.lat, 10);
        setSelectedTeam(team);
      });
    });

    // Add circuit markers
    circuits.circuits.forEach((circuit) => {
      const el = document.createElement('div');
      el.className = 'circuit-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.backgroundImage = `url('/markers/flag.svg')`;
      el.style.backgroundSize = 'contain';
      
      // Check if race is upcoming
      if (circuit.raceDate2025) {
        const raceDate = new Date(circuit.raceDate2025);
        const today = new Date();
        if (raceDate > today) {
          el.classList.add('active-race');
        }
      }

      new mapboxgl.Marker(el)
        .setLngLat([circuit.location.lng, circuit.location.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        flyToLocation(circuit.location.lng, circuit.location.lat, 12);
        setSelectedCircuit(circuit);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const flyToLocation = (lng: number, lat: number, zoom: number) => {
    map.current?.flyTo({
      center: [lng, lat],
      zoom: zoom,
      speed: 1.2,
      curve: 1.42,
      duration: 3000,
      essential: true
    });
  };

  // Commented out for future use
  // const flyFromTeamToCircuit = (teamId: string, circuitId: string) => {
  //   const team = teams.teams.find(t => t.id === teamId);
  //   const circuit = circuits.circuits.find(c => c.id === circuitId);
  //   
  //   if (!team || !circuit) return;
  //
  //   // First fly to team HQ
  //   flyToLocation(team.headquarters.lng, team.headquarters.lat, 10);
  //   
  //   // Then fly to circuit after a delay
  //   setTimeout(() => {
  //     flyToLocation(circuit.location.lng, circuit.location.lat, 12);
  //   }, 4000);
  // };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Info Panel */}
      {(selectedTeam || selectedCircuit) && (
        <div className="absolute top-4 right-4 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
          {selectedTeam && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: selectedTeam.colors.primary }}>
                {selectedTeam.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {selectedTeam.headquarters.city}, {selectedTeam.headquarters.country}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Team Principal: {selectedTeam.teamPrincipal}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Founded: {selectedTeam.foundingYear}
              </p>
              <p className="text-gray-700 dark:text-gray-200">{selectedTeam.description}</p>
              <button
                onClick={() => setSelectedTeam(null)}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          )}
          
          {selectedCircuit && (
            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedCircuit.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedCircuit.country}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Track Length: {selectedCircuit.length} km
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Lap Record: {selectedCircuit.lapRecord.time} ({selectedCircuit.lapRecord.driver}, {selectedCircuit.lapRecord.year})
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                2025 Race Date: {selectedCircuit.raceDate2025 ? new Date(selectedCircuit.raceDate2025).toLocaleDateString() : 'TBD'}
              </p>
              <button
                onClick={() => setSelectedCircuit(null)}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}