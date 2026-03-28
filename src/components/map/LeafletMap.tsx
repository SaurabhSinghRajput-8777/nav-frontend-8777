"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useNavigation } from "@/contexts/NavigationContext";

import api from "@/lib/api";

/* ========= CONSTANTS ========= */
const DELHI_CENTER: [number, number] = [28.6139, 77.2090]; // Leaflet uses [lat, lng]

type FilterType = "all" | "highly_accessible" | "avoid_stairs" | "lift_available";

function getScoreColor(score: number): string {
  if (score >= 85) return "#16a34a";
  if (score >= 70) return "#f59e0b";
  return "#dc2626";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Highly Accessible";
  if (score >= 70) return "Moderately Accessible";
  return "Limited Access";
}

const createCustomIcon = (score: number, name: string) => {
  const color = getScoreColor(score);
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; border: 3px solid white; box-shadow: 0 2px 8px ${color}88; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.7rem;" title="${name}">${score}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div style="width: 18px; height: 18px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(59,130,246,0.7); animation: pulse-user 2s infinite;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// A small component to control map viewport dynamically
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 2 });
  }, [center, zoom, map]);
  return null;
}

/* ========= MAIN COMPONENT ========= */
export default function LeafletMap() {
  const params = useSearchParams();
  const filterQuery = params.get("filter") as FilterType | null;
  const toQuery = params.get("to");
  const { isWheelchair } = useAccessibilityProfile();
  const { 
    isActive: isNavActive, 
    steps: routeInstructions, 
    targetBuilding: navigatingTo, 
    setCurrentStep,
    clearNavigation,
    setNavigation
  } = useNavigation();

  const [buildings, setBuildings] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DELHI_CENTER);
  const [mapZoom, setMapZoom] = useState(11);
  const [userLoc, setUserLoc] = useState<[number, number]>(DELHI_CENTER);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fetch buildings from Neon DB
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await api.get("/api/buildings/", { skipLoading: true } as any);
        setBuildings(res.data);
      } catch (err) {
        console.error("Failed to fetch buildings from Neon:", err);
      }
    };
    fetchBuildings();
  }, []);

  // GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLoc([latitude, longitude]);
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Search logic
  const searchResults = searchTerm.trim() === "" ? [] : buildings.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter buildings
  const filteredBuildings = buildings.filter(b => {
    switch (filter) {
      case "highly_accessible": return b.score >= 85;
      case "avoid_stairs": return !b.stairs || b.lift;
      case "lift_available": return b.lift;
      default: return true;
    }
  });

  // Start navigation
  const startNavigation = useCallback((building: any) => {
    const steps = [
      { instruction: `Start heading towards ${building.name}`, distance: "0 m", duration: "0 min" },
      { instruction: "Continue on Rajpath heading east", distance: "1.2 km", duration: "5 min" },
      { instruction: isWheelchair ? "Take the accessible ramp on the right" : "Turn right at the major intersection", distance: "800 m", duration: "3 min" },
      { instruction: `Arrive at ${building.name}`, distance: "200 m", duration: "1 min" },
    ];
    setNavigation(building.name, steps, building);
    setSelectedBuilding(null);
    setMapCenter([building.lat, building.lng]);
    setMapZoom(15);
  }, [isWheelchair, setNavigation]);

  const recenterOnUser = () => {
    setMapCenter(userLoc);
    setMapZoom(16);
  };

  useEffect(() => {
    if (filterQuery) {
      setFilter((["all", "highly_accessible", "avoid_stairs", "lift_available"].includes(filterQuery) ? filterQuery : "all") as FilterType);
    }
  }, [filterQuery]);

  useEffect(() => {
    if (toQuery) {
      const target = buildings.find((b: any) => b.name.toLowerCase().includes(toQuery.toLowerCase()) || b.id.toLowerCase() === toQuery.toLowerCase());
      if (target) {
        startNavigation(target);
      }
    }
  }, [toQuery, startNavigation, buildings]);

  // AI Tool Listener for Map Controls
  useEffect(() => {
    const handleTool = (e: any) => {
      const { tool, args } = e.detail;
      
      if (tool === "zoom_map") {
        if (args.zoom_level) setMapZoom(args.zoom_level);
        if (args.center_on) {
            const b = buildings.find((x: any) => x.name.toLowerCase().includes(args.center_on.toLowerCase()) || x.id === args.center_on);
            if (b) setMapCenter([b.lat, b.lng]);
        }
      } else if (tool === "highlight_building" || tool === "show_building_info") {
          const b = buildings.find((x: any) => x.name.toLowerCase().includes(args.building_name.toLowerCase()) || x.id === args.building_name);
          if (b) {
              setMapCenter([b.lat, b.lng]);
              setMapZoom(16);
              setSelectedBuilding(b);
          }
      } else if (tool === "filter_buildings") {
          if (args.wheelchair_accessible) setFilter("avoid_stairs");
          else if (args.has_lift) setFilter("lift_available");
          else if (args.show_all) setFilter("all");
      }
    };

    window.addEventListener("navai-tool", handleTool);
    return () => window.removeEventListener("navai-tool", handleTool);
  }, [buildings]);

  // Route calculation
  const routeCoordinates: [number, number][] = navigatingTo ? [
    userLoc,
    [(userLoc[0] + navigatingTo.lat) / 2 + 0.005, (userLoc[1] + navigatingTo.lng) / 2 + 0.01],
    [navigatingTo.lat, navigatingTo.lng]
  ] : [];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <style>{`
        @keyframes pulse-user {
          0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.5); transform: scale(1); }
          50% { box-shadow: 0 0 20px rgba(59,130,246,0.9); transform: scale(1.15); }
        }
        .leaflet-container { width: 100%; height: 100%; font-family: inherit; }
        .leaflet-top { z-index: 1200 !important; top: 1rem !important; left: 1rem !important; }
        .leaflet-bar { border: none !important; box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important; overflow: hidden; border-radius: 12px !important; }
        .leaflet-bar a { background-color: rgba(15,23,42,0.9) !important; color: white !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
        .leaflet-bar a:hover { background-color: #3b82f6 !important; }
      `}</style>

      {/* ====== CENTERED SEARCH BAR ====== */}
      <div style={{
        position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 1300, width: "calc(100% - 100px)", maxWidth: "500px"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)",

          padding: "10px 16px", borderRadius: "14px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <span style={{ fontSize: "1.2rem" }}>🔍</span>
          <input
            type="text"
            placeholder="Search for a building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearching(true)}
            style={{
              flex: 1, background: "transparent", border: "none", color: "white",
              fontSize: "0.95rem", outline: "none",
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem" }}
            >
              ✕
            </button>
          ) }
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <div style={{
            marginTop: "8px", background: "rgba(15,23,42,0.95)", backdropFilter: "blur(16px)",
            borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
          }}>
            {searchResults.map(b => (
              <div
                key={b.id}
                onClick={() => {
                  setMapCenter([b.lat, b.lng]);
                  setMapZoom(16);
                  setSelectedBuilding(b);
                  setSearchTerm("");
                  setIsSearching(false);
                }}
                style={{
                  padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "background 0.2s"
                }}
              >
                <div>
                  <p style={{ color: "white", margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{b.name}</p>
                  <p style={{ color: "#94a3b8", margin: "2px 0 0 0", fontSize: "0.75rem" }}>{b.description || "Building"}</p>
                </div>
                <span style={{ color: getScoreColor(b.score), fontWeight: 800, fontSize: "0.8rem" }}>{b.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* ====== FILTER BAR ====== */}
      <div style={{
        position: "absolute", top: "6.5rem", left: "1rem",
        zIndex: 1000, display: "flex", flexDirection: "column", gap: "0.4rem",
        background: "rgba(15,23,42,0.85)", padding: "10px", borderRadius: "14px",
        backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}>
        {([ 
          { key: "all", label: "All", icon: "🏢" },
          { key: "highly_accessible", label: "Safe", icon: "✅" },
          { key: "avoid_stairs", label: "No Stairs", icon: "♿" },
          { key: "lift_available", label: "Lift", icon: "🛗" },
        ] as { key: FilterType; label: string; icon: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "4px 10px", borderRadius: "8px", border: "none",
              background: filter === f.key ? "#3b82f6" : "rgba(255,255,255,0.05)",
              color: filter === f.key ? "white" : "#94a3b8",
              fontWeight: 600, fontSize: "0.75rem", cursor: "pointer",
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* ====== RECENTER BUTTON ====== */}
      <button
        onClick={recenterOnUser}
        style={{
          position: "absolute", bottom: "1.5rem", right: "1rem", zIndex: 1000,
          width: "50px", height: "50px", borderRadius: "50%", background: "#3b82f6",
          border: "4px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.5rem", color: "white", cursor: "pointer",
          boxShadow: "0 4px 15px rgba(59,130,246,0.6)", transition: "all 0.2s"
        }}
        title="Recenter on me"
      >
        🎯
      </button>

      {/* ====== LEAFLET MAP ====== */}
      <MapContainer 
        center={DELHI_CENTER} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <Marker position={userLoc} icon={userLocationIcon} />

        {/* Building Markers */}
        {filteredBuildings.map(building => (
          <Marker 
            key={building.id}
            position={[building.lat, building.lng]}
            icon={createCustomIcon(building.score, building.name)}
            eventHandlers={{
              click: () => {
                setSelectedBuilding(building);
              },
            }}
          />
        ))}

        {/* Selected Building Popup */}
        {selectedBuilding && (
          <Popup 
            position={[selectedBuilding.lat, selectedBuilding.lng]}
            eventHandlers={{ remove: () => setSelectedBuilding(null) }}
          >
            <div style={{ padding: "4px 0", minWidth: "220px" }}>
              <h3 style={{ margin: "0 0 2px 0", fontSize: "1rem" }}>{selectedBuilding.name}</h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#64748b" }}>{selectedBuilding.description}</p>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.7rem", color: getScoreColor(selectedBuilding.score), fontWeight: 800 }}>Score: {selectedBuilding.score}</span>
              </div>
              <button
                onClick={() => startNavigation(selectedBuilding)}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                🧭 Navigate Here
              </button>
            </div>
          </Popup>
        )}

        {/* Route visualization */}
        {navigatingTo && (
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: '#10b981', weight: 6, opacity: 0.8, lineCap: "round" }} 
          />
        )}
      </MapContainer>

      {/* ====== ROUTE BOTTOM SHEET ====== */}
      {isNavActive && navigatingTo && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: "linear-gradient(to top, rgba(6, 78, 59, 0.95), rgba(15, 23, 42, 0.95))",
          backdropFilter: "blur(12px)",
          borderTopLeftRadius: "24px", borderTopRightRadius: "24px",
          padding: "1.2rem", maxHeight: "40vh", overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.6)", 
          borderTop: "2px solid rgba(16, 185, 129, 0.3)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "white", fontSize: "1.1rem", margin: 0, fontWeight: 800 }}>
              <span style={{ color: "#10b981" }}>Confirmed:</span> Navigating to {navigatingTo.name}
            </h3>
            <button
               onClick={clearNavigation}
               style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}
            >
              Stop
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {routeInstructions.map((inst, idx) => (
              <div 
                key={idx} 
                onClick={() => setCurrentStep(idx)}
                style={{
                  display: "flex", gap: "1rem", padding: "0.8rem", 
                  background: "rgba(16, 185, 129, 0.08)", 
                  borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.15)",
                  cursor: "pointer"
                }}
              >
                <div style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: "#10b981", color: "white", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 800, flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <p style={{ color: "white", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>{inst.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
