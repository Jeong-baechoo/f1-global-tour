'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Mapbox
const Map = dynamic(
  () => import('@/components/Map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading F1 Global Tour...</div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Map />
      
      {/* Title Overlay */}
      <div className="absolute top-0 left-0 p-8 pointer-events-none">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
          F1 Global Tour
        </h1>
        <p className="text-lg text-white/80 drop-shadow-md">
          Explore the journey from factory to glory
        </p>
      </div>
    </div>
  );
}