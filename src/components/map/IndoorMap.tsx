"use client";

import { useMemo, useEffect } from "react";
import { Source, Layer } from "react-map-gl";
import { useVoiceCommandContext } from "../voice/VoiceCommandProvider";

interface IndoorMapProps {
  activeFloor: number;
  userLocation: [number, number]; // [lng, lat]
  mode: string; // "Wheelchair / Mobility", "Blind / Low Vision", etc.
}

// Mock GeoJSON data for university building (centered near generic coords, e.g. 0,0 for simplicity or real coords)
// We'll use lng: -122.4194, lat: 37.7749 (San Francisco)
const CENTER: [number, number] = [-122.4194, 37.7749];

const ROOMS = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "101", name: "Room 101", floor: 1, accessibility: 90 }, geometry: { type: "Polygon", coordinates: [[[-122.4195, 37.7750], [-122.4193, 37.7750], [-122.4193, 37.7748], [-122.4195, 37.7748], [-122.4195, 37.7750]]] } },
    { type: "Feature", properties: { id: "102", name: "Room 102", floor: 1, accessibility: 40 }, geometry: { type: "Polygon", coordinates: [[[-122.4193, 37.7750], [-122.4191, 37.7750], [-122.4191, 37.7748], [-122.4193, 37.7748], [-122.4193, 37.7750]]] } },
    { type: "Feature", properties: { id: "201", name: "Lab 201", floor: 2, accessibility: 100 }, geometry: { type: "Polygon", coordinates: [[[-122.4195, 37.7750], [-122.4193, 37.7750], [-122.4193, 37.7748], [-122.4195, 37.7748], [-122.4195, 37.7750]]] } },
  ]
};

const PATHS = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "p1", floor: 1, isAccessible: true }, geometry: { type: "LineString", coordinates: [[-122.4196, 37.7749], [-122.4194, 37.7749], [-122.4194, 37.7751]] } },
    { type: "Feature", properties: { id: "p2", floor: 1, isAccessible: false }, geometry: { type: "LineString", coordinates: [[-122.4194, 37.7749], [-122.4192, 37.7749]] } }, // stairs path
    { type: "Feature", properties: { id: "p3", floor: 2, isAccessible: true }, geometry: { type: "LineString", coordinates: [[-122.4194, 37.7749], [-122.4194, 37.7751]] } },
  ]
};

const POIS = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { type: "lift", floor: 1 }, geometry: { type: "Point", coordinates: [-122.4194, 37.7749] } },
    { type: "Feature", properties: { type: "lift", floor: 2 }, geometry: { type: "Point", coordinates: [-122.4194, 37.7749] } },
    { type: "Feature", properties: { type: "stairs", floor: 1 }, geometry: { type: "Point", coordinates: [-122.4192, 37.7749] } },
    { type: "Feature", properties: { type: "stairs", floor: 2 }, geometry: { type: "Point", coordinates: [-122.4192, 37.7749] } },
  ]
};

export default function IndoorMap({ activeFloor, userLocation, mode }: IndoorMapProps) {
  const { speak } = useVoiceCommandContext();

  // Filter features based on floor
  const activeRooms = useMemo(() => ({
    type: "FeatureCollection",
    features: ROOMS.features.filter(f => f.properties.floor === activeFloor)
  }), [activeFloor]);

  const activePaths = useMemo(() => ({
    type: "FeatureCollection",
    features: PATHS.features.filter(f => {
      if (f.properties.floor !== activeFloor) return false;
      if (mode.includes("Wheelchair") && !f.properties.isAccessible) return false;
      return true;
    })
  }), [activeFloor, mode]);

  const activePois = useMemo(() => ({
    type: "FeatureCollection",
    features: POIS.features.filter(f => f.properties.floor === activeFloor)
  }), [activeFloor]);

  // Blind mode auto-announce 
  useEffect(() => {
    if (mode.includes("Blind")) {
      // Very basic distance check simulation
      const nearbyRoom = ROOMS.features.find(r => 
        r.properties.floor === activeFloor &&
        Math.abs(r.geometry.coordinates[0][0][0] - userLocation[0]) < 0.0005 &&
        Math.abs(r.geometry.coordinates[0][0][1] - userLocation[1]) < 0.0005
      );
      if (nearbyRoom) {
        speak(`Approaching ${nearbyRoom.properties.name}`);
      }
    }
  }, [userLocation, activeFloor, mode, speak]);

  return (
    <>
      {/* Rooms Layer: Color coded by accessibility score */}
      <Source id="indoor-rooms" type="geojson" data={activeRooms as any}>
        <Layer 
          id="rooms-fill" 
          type="fill" 
          paint={{
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'accessibility'],
              0, '#dc2626', // Red - low accessibility
              50, '#fbbf24', // Yellow - medium
              100, '#16a34a' // Green - highly accessible
            ],
            'fill-opacity': 0.5
          }} 
        />
        <Layer 
          id="rooms-line" 
          type="line" 
          paint={{
            'line-color': '#ffffff',
            'line-width': 2
          }} 
        />
      </Source>

      {/* Paths Layer: Animated dashed blue line */}
      <Source id="indoor-paths" type="geojson" data={activePaths as any}>
        <Layer 
          id="paths-line" 
          type="line" 
          paint={{
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-dasharray': [2, 2]
            // We would animate line-dasharray offset here via requestAnimationFrame in a real app
          }} 
        />
      </Source>

      {/* POI Layer: Lifts and Stairs */}
      <Source id="indoor-pois" type="geojson" data={activePois as any}>
        <Layer 
          id="pois-points" 
          type="circle" 
          paint={{
            'circle-radius': 10,
            'circle-color': [
              'match',
              ['get', 'type'],
              'lift', '#3b82f6', // blue lift
              'stairs', '#dc2626', // red/blocked stairs
              '#000000'
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }} 
        />
      </Source>
    </>
  );
}
