"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import api from "@/lib/api";

type Node = {
  id: string;
  name: string;
  floor: number;
  type: "room" | "lift" | "stairs" | "entrance" | "corridor";
  x: number;
  y: number;
  score?: number;
  w?: number; // width for rect rendering
  h?: number; // height for rect rendering
};

type Edge = {
  from: string;
  to: string;
  distance: number;
};

// --- GRAPH DATA ---
const NODES: Node[] = [
  // --- FLOOR 0 ---
  { id: "f0_entrance", name: "Main Entrance", floor: 0, type: "entrance", x: 400, y: 550, score: 100, w: 120, h: 40 },
  { id: "f0_reception", name: "Reception", floor: 0, type: "room", x: 400, y: 450, score: 95, w: 120, h: 60 },
  { id: "f0_library", name: "Library", floor: 0, type: "room", x: 200, y: 200, score: 92, w: 160, h: 100 },
  { id: "f0_cafeteria", name: "Cafeteria", floor: 0, type: "room", x: 600, y: 200, score: 78, w: 160, h: 100 },
  { id: "f0_restroom", name: "Restroom", floor: 0, type: "room", x: 300, y: 400, score: 100, w: 80, h: 60 },
  { id: "f0_lift", name: "Lift", floor: 0, type: "lift", x: 400, y: 300, w: 40, h: 40 },
  { id: "f0_stairs", name: "Stairs", floor: 0, type: "stairs", x: 700, y: 300, w: 60, h: 60 },
  { id: "f0_security", name: "Security Room", floor: 0, type: "room", x: 500, y: 400, score: 100, w: 100, h: 60 },
  { id: "f0_medical", name: "Medical Room", floor: 0, type: "room", x: 200, y: 400, score: 90, w: 100, h: 60 },
  
  // Corridor junction nodes
  { id: "f0_c1", name: "", floor: 0, type: "corridor", x: 400, y: 500 }, // between entry and rec
  { id: "f0_c2", name: "", floor: 0, type: "corridor", x: 200, y: 300 }, // front of library
  { id: "f0_c3", name: "", floor: 0, type: "corridor", x: 600, y: 300 }, // front of cafeteria
  { id: "f0_c4", name: "", floor: 0, type: "corridor", x: 300, y: 300 },
  { id: "f0_c5", name: "", floor: 0, type: "corridor", x: 500, y: 300 },
  { id: "f0_c6", name: "", floor: 0, type: "corridor", x: 200, y: 460 }, // near medical

  // --- FLOOR 1 ---
  { id: "f1_lab1", name: "Computer Lab 1", floor: 1, type: "room", x: 200, y: 200, score: 85, w: 160, h: 100 },
  { id: "f1_lab2", name: "Computer Lab 2", floor: 1, type: "room", x: 400, y: 200, score: 85, w: 140, h: 100 },
  { id: "f1_lec_a", name: "Lecture Hall A", floor: 1, type: "room", x: 600, y: 200, score: 80, w: 140, h: 100 },
  { id: "f1_lec_b", name: "Lecture Hall B", floor: 1, type: "room", x: 200, y: 400, score: 80, w: 160, h: 100 },
  { id: "f1_faculty", name: "Faculty Room", floor: 1, type: "room", x: 500, y: 400, score: 88, w: 140, h: 100 },
  { id: "f1_restroom", name: "Restroom", floor: 1, type: "room", x: 300, y: 400, score: 100, w: 80, h: 60 },
  { id: "f1_lift", name: "Lift", floor: 1, type: "lift", x: 400, y: 300, w: 40, h: 40 },
  { id: "f1_stairs", name: "Stairs", floor: 1, type: "stairs", x: 700, y: 300, w: 60, h: 60 },

  { id: "f1_c1", name: "", floor: 1, type: "corridor", x: 200, y: 300 },
  { id: "f1_c2", name: "", floor: 1, type: "corridor", x: 600, y: 300 },
  { id: "f1_c3", name: "", floor: 1, type: "corridor", x: 300, y: 300 },
  { id: "f1_c4", name: "", floor: 1, type: "corridor", x: 500, y: 300 },

  // --- FLOOR 2 ---
  { id: "f2_seminar", name: "Seminar Hall", floor: 2, type: "room", x: 200, y: 200, score: 83, w: 160, h: 100 },
  { id: "f2_research", name: "Research Lab", floor: 2, type: "room", x: 400, y: 200, score: 87, w: 140, h: 100 },
  { id: "f2_hod", name: "HOD Office", floor: 2, type: "room", x: 600, y: 200, score: 79, w: 140, h: 100 },
  { id: "f2_conference", name: "Conference Room", floor: 2, type: "room", x: 200, y: 400, score: 88, w: 160, h: 100 },
  { id: "f2_restroom", name: "Restroom", floor: 2, type: "room", x: 300, y: 400, score: 100, w: 80, h: 60 },
  { id: "f2_lift", name: "Lift", floor: 2, type: "lift", x: 400, y: 300, w: 40, h: 40 },
  { id: "f2_stairs", name: "Stairs", floor: 2, type: "stairs", x: 700, y: 300, w: 60, h: 60 },

  { id: "f2_c1", name: "", floor: 2, type: "corridor", x: 200, y: 300 },
  { id: "f2_c2", name: "", floor: 2, type: "corridor", x: 600, y: 300 },
  { id: "f2_c3", name: "", floor: 2, type: "corridor", x: 300, y: 300 },
];

// Helper to calc distance
const dist = (a: string, b: string) => {
  const n1 = NODES.find(n => n.id === a)!;
  const n2 = NODES.find(n => n.id === b)!;
  if (!n1 || !n2) return 0;
  if (n1.floor !== n2.floor) return 100; // Floor transition cost
  return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
};

const BASE_EDGES: {from: string, to: string}[] = [
  // F0 horizontally
  { from: "f0_c2", to: "f0_c4" },
  { from: "f0_c4", to: "f0_lift" },
  { from: "f0_lift", to: "f0_c5" },
  { from: "f0_c5", to: "f0_c3" },
  { from: "f0_c3", to: "f0_stairs" },

  // F0 vertically
  { from: "f0_entrance", to: "f0_c1" },
  { from: "f0_c1", to: "f0_reception" },
  { from: "f0_reception", to: "f0_lift" },
  { from: "f0_c2", to: "f0_library" },
  { from: "f0_c3", to: "f0_cafeteria" },
  { from: "f0_c4", to: "f0_restroom" },
  { from: "f0_c5", to: "f0_security" },
  { from: "f0_c2", to: "f0_c6" },
  { from: "f0_c6", to: "f0_medical" },

  // F1 horizontally
  { from: "f1_c1", to: "f1_c3" },
  { from: "f1_c3", to: "f1_lift" },
  { from: "f1_lift", to: "f1_c4" },
  { from: "f1_c4", to: "f1_c2" },
  { from: "f1_c2", to: "f1_stairs" },

  // F1 vertically
  { from: "f1_c1", to: "f1_lab1" },
  { from: "f1_c1", to: "f1_lec_b" },
  { from: "f1_lift", to: "f1_lab2" },
  { from: "f1_c2", to: "f1_lec_a" },
  { from: "f1_c4", to: "f1_faculty" },
  { from: "f1_c3", to: "f1_restroom" },

  // F2 horizontally
  { from: "f2_c1", to: "f2_c3" },
  { from: "f2_c3", to: "f2_lift" },
  { from: "f2_lift", to: "f2_hod" },
  { from: "f2_hod", to: "f2_stairs" }, // Wait! From lift to HOD isn't quite right.
  // Actually let's use c2
  { from: "f2_lift", to: "f2_c2" },
  { from: "f2_c2", to: "f2_stairs" },

  // F2 vertically
  { from: "f2_c1", to: "f2_seminar" },
  { from: "f2_c1", to: "f2_conference" },
  { from: "f2_lift", to: "f2_research" },
  { from: "f2_c2", to: "f2_hod" },
  { from: "f2_c3", to: "f2_restroom" },

  // Inter-floor
  { from: "f0_lift", to: "f1_lift" },
  { from: "f1_lift", to: "f2_lift" },
  { from: "f0_stairs", to: "f1_stairs" },
  { from: "f1_stairs", to: "f2_stairs" },
];

const EDGES: Edge[] = BASE_EDGES.map(e => ({
  from: e.from,
  to: e.to,
  distance: dist(e.from, e.to)
}));

// Create adjacency list bidirectionally
const getGraph = (isWheelchair: boolean) => {
  const g: Record<string, {node: string, weight: number}[]> = {};
  NODES.forEach(n => g[n.id] = []);
  
  EDGES.forEach(e => {
    let weight = e.distance;
    
    // IF Wheelchair, block stair edges
    const isStairEdge = e.from.includes("stairs") && e.to.includes("stairs");
    if (isWheelchair && isStairEdge) {
      weight = Infinity;
    }

    g[e.from].push({ node: e.to, weight });
    g[e.to].push({ node: e.from, weight });
  });
  return g;
};


// Dijkstra implementation
function findShortestPath(startId: string, endId: string, graph: Record<string, {node: string, weight: number}[]>) {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(Object.keys(graph));

  Object.keys(graph).forEach(n => distances[n] = Infinity);
  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let minD = Infinity;
    for (const n of Array.from(unvisited)) {
      if (distances[n] < minD) {
        minD = distances[n];
        current = n;
      }
    }

    if (current === null || current === endId) break;

    unvisited.delete(current);

    for (const neighbor of graph[current]) {
      if (!unvisited.has(neighbor.node)) continue;
      const alt = distances[current] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = current;
      }
    }
  }

  const path = [];
  let curr = endId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr] || "";
    if (curr === startId) {
      path.unshift(startId);
      break;
    }
  }
  
  if (path[0] !== startId) return []; // no path found
  return path;
}


interface Props {
  activeFloor: number;
  setActiveFloor: (f: number) => void;
  routeTo?: string; // Query like "library"
  isDemo?: boolean;
  reportObstacleOpen?: boolean;
  profile: string;
}

export default function BennettSVGMap({ activeFloor, setActiveFloor, routeTo, isDemo, reportObstacleOpen, profile }: Props) {
  
  const [userNodeId, setUserNodeId] = useState("f0_entrance");
  const [pathSequence, setPathSequence] = useState<string[]>([]);
  const [demoIndex, setDemoIndex] = useState(0);

  const [feedbackCategory, setFeedbackCategory] = useState("obstacle");
  const [feedbackText, setFeedbackText] = useState("");
  const [reportState, setReportState] = useState<"idle"|"submitting"|"success">("idle");

  const [showModalOverride, setShowModalOverride] = useState(false);

  // Derive target node from routeTo query
  const targetNodeId = useMemo(() => {
    if (!routeTo) return null;
    const lower = routeTo.toLowerCase();
    
    // Keyword matching
    const match = NODES.find(n => 
      n.type === "room" && 
      (n.name.toLowerCase().includes(lower) || 
       (lower.includes("restroom") && n.name.toLowerCase().includes("restroom")) ||
       (lower.includes("lab") && n.name.toLowerCase().includes("lab"))
      )
    );
    return match ? match.id : null;
  }, [routeTo]);

  const isWheelchair = profile?.includes("Wheelchair");

  // Calculate Path
  useEffect(() => {
    if (targetNodeId && userNodeId !== targetNodeId) {
      const graph = getGraph(isWheelchair);
      const sp = findShortestPath(userNodeId, targetNodeId, graph);
      setPathSequence(sp);
      setDemoIndex(0);
    } else {
      setPathSequence([]);
    }
  }, [targetNodeId, userNodeId, isWheelchair]);

  // Demo Simulation runner
  useEffect(() => {
    if (!isDemo || pathSequence.length === 0) return;
    
    const interval = setInterval(() => {
      setDemoIndex(prev => {
        const next = prev + 1;
        if (next >= pathSequence.length) {
          clearInterval(interval);
          return prev; 
        }
        // Move user to next node securely!
        const nextNodeId = pathSequence[next];
        const nObj = NODES.find(n => n.id === nextNodeId);
        if (nObj && nObj.floor !== activeFloor) {
          setActiveFloor(nObj.floor); // Switch floor automatically during demo
        }
        return next;
      });
    }, 1500); // 1.5 seconds per node step

    return () => clearInterval(interval);
  }, [isDemo, pathSequence, activeFloor, setActiveFloor]);

  // Update real user node position from demo progress
  const currentUserPosition = useMemo(() => {
    if (pathSequence.length > 0 && demoIndex < pathSequence.length) {
      return NODES.find(n => n.id === pathSequence[demoIndex]);
    }
    return NODES.find(n => n.id === userNodeId);
  }, [pathSequence, demoIndex, userNodeId]);


  // Rendering active floor nodes & paths
  const floorNodes = NODES.filter(n => n.floor === activeFloor);
  
  // Render Path segments on active floor
  const renderPathSegments = () => {
    if (pathSequence.length < 2) return null;
    
    const segments = [];
    for (let i = 0; i < pathSequence.length - 1; i++) {
        const n1 = NODES.find(n => n.id === pathSequence[i])!;
        const n2 = NODES.find(n => n.id === pathSequence[i+1])!;
        
        if (n1.floor === activeFloor && n2.floor === activeFloor) {
            segments.push(
                <line 
                  key={`P${i}`} 
                  x1={n1.x} y1={n1.y} 
                  x2={n2.x} y2={n2.y} 
                  stroke="#3b82f6" 
                  strokeWidth="6" 
                  strokeDasharray="10 5" 
                  className="anim-dash"
                />
            );
        }
    }
    return segments;
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return "#475569";
    if (score >= 90) return "#16a34a"; // Green
    if (score >= 80) return "#65a30d"; // Light green/amber
    if (score >= 70) return "#fbbf24"; // Amber
    return "#dc2626"; // Red
  };

  const handleReportObstacle = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportState("submitting");
    try {
      await api.post("/api/feedback", {
        text: `Obstacle at Floor ${activeFloor}: ${feedbackText}`,
        category: feedbackCategory,
        latitude: currentUserPosition?.x, // Abusing lat/lng for x/y locally
        longitude: currentUserPosition?.y,
      });
      setReportState("success");
      setTimeout(() => {
        setShowModalOverride(false);
      }, 2000);
    } catch {
      alert("Failed to submit");
      setReportState("idle");
    }
  };

  const isModalOpen = reportObstacleOpen || showModalOverride;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", maxWidth: "900px", maxHeight: "700px", background: "#1e293b", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
      
      {/* SVG Container */}
      <svg viewBox="0 0 800 600" width="100%" height="100%">
        {/* Background Grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Static Path / Corridors */}
        {BASE_EDGES.map((edge, i) => {
          const n1 = NODES.find(n => n.id === edge.from);
          const n2 = NODES.find(n => n.id === edge.to);
          if (n1 && n2 && n1.floor === activeFloor && n2.floor === activeFloor) {
            // Check if blocked stair transition
            const isStair = n1.type === "stairs" && n2.type === "stairs"; 
            if (isWheelchair && isStair) return null; // Dont draw unreachable
            return (
              <line key={`baseE${i}`} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="#334155" strokeWidth="20" strokeLinecap="round" />
            );
          }
          return null;
        })}

        {/* Rooms / Features */}
        {floorNodes.map(node => {
           if (node.type === "room" || node.type === "entrance") {
             const fw = node.w || 100;
             const fh = node.h || 60;
             const color = getScoreColor(node.score);
             return (
               <g key={node.id} transform={`translate(${node.x - fw/2}, ${node.y - fh/2})`}>
                 <rect width={fw} height={fh} rx="8" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="3" />
                 <text x={fw/2} y={fh/2} fill="white" fontSize="14" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
                   {node.name}
                 </text>
                 {node.score && (
                   <text x={fw/2} y={fh/2 + 18} fill={color} fontSize="11" fontWeight="700" textAnchor="middle">
                     Score: {node.score}
                   </text>
                 )}
                 {node.name.includes("Restroom") && (
                   <text x={fw/2} y={fh/2 - 18} fontSize="20" textAnchor="middle">♿</text>
                 )}
               </g>
             );
           }
           
           if (node.type === "lift") {
             return (
               <g key={node.id} transform={`translate(${node.x - 20}, ${node.y - 20})`}>
                 <rect width="40" height="40" rx="4" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" />
                 <text x="20" y="20" fill="white" fontSize="20" textAnchor="middle" dominantBaseline="middle">🛗</text>
               </g>
             );
           }

           if (node.type === "stairs") {
             const blocked = isWheelchair;
             return (
               <g key={node.id} transform={`translate(${node.x - 30}, ${node.y - 30})`}>
                 <rect width="60" height="60" rx="4" fill={blocked ? "#991b1b" : "#475569"} stroke={blocked ? "#ef4444" : "#94a3b8"} strokeWidth="2" />
                 <text x="30" y="30" fill="white" fontSize="24" textAnchor="middle" dominantBaseline="middle">
                   {blocked ? "🚫" : "🪜"}
                 </text>
               </g>
             );
           }
           return null;
        })}

        {/* Animated Dashed Routing Path */}
        {renderPathSegments()}

        {/* User Marker */}
        {currentUserPosition && currentUserPosition.floor === activeFloor && (
          <g transform={`translate(${currentUserPosition.x}, ${currentUserPosition.y})`}>
            <circle r="12" fill="#60a5fa">
              <animate attributeName="r" values="12; 20; 12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1; 0.5; 1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="#1e40af" />
          </g>
        )}
      </svg>

      {/* Target Marker Label */}
      {targetNodeId && (
         <div style={{ position: "absolute", bottom: "1rem", left: "1rem", background: "rgba(15,23,42,0.8)", padding: "1rem", borderRadius: "12px", border: "1px solid #3b82f6" }}>
           <h3 style={{ margin: "0 0 0.25rem 0", color: "#60a5fa", fontSize: "1rem" }}>Navigating to:</h3>
           <p style={{ margin: 0, fontWeight: "bold" }}>{NODES.find(n => n.id === targetNodeId)?.name || targetNodeId}</p>
         </div>
      )}

      {/* Quick Report FAB */}
      <button 
        onClick={() => setShowModalOverride(true)}
        style={{
          position: "absolute", top: "1rem", right: "1rem", background: "#ef4444", color: "white", 
          padding: "0.75rem 1rem", borderRadius: "30px", border: "none", fontWeight: "bold", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
        }}
      >
        ⚠️ Report Obstacle
      </button>

      {/* Reporting Modal */}
      {isModalOpen && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#1e293b", padding: "2rem", borderRadius: "16px", width: "400px", maxWidth: "90%", border: "1px solid #ef4444" }}>
            <h2 style={{ marginTop: 0, color: "#f87171" }}>Report Obstacle Here</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Location auto-detected: Floor {activeFloor} near {currentUserPosition?.name || "Corridor"}
            </p>

            {reportState === "success" ? (
              <div style={{ background: "#16a34a", color: "white", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                ✅ Obstacle Reported! Alerting admins.
              </div>
            ) : (
              <form onSubmit={handleReportObstacle} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <select 
                  value={feedbackCategory} onChange={e => setFeedbackCategory(e.target.value)}
                  style={{ padding: "0.75rem", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                >
                  <option value="obstacle">Physical Obstacle / Blockage</option>
                  <option value="broken_infrastructure">Broken Infrastructure (e.g. Lift out of order)</option>
                  <option value="hazard">Safety Hazard</option>
                </select>
                <textarea 
                  value={feedbackText} onChange={e => setFeedbackText(e.target.value)} 
                  placeholder="Describe what is blocking the path..."
                  rows={4} required
                  style={{ padding: "0.75rem", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white", resize: "none" }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setShowModalOverride(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", background: "transparent", color: "white", border: "1px solid #475569" }}>Cancel</button>
                  <button type="submit" disabled={reportState === "submitting"} style={{ flex: 2, padding: "0.75rem", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", fontWeight: "bold" }}>
                    {reportState === "submitting" ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CSS Animation for dashed path */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .anim-dash {
          animation: dash 1s linear infinite;
        }
      `}} />
    </div>
  );
}
