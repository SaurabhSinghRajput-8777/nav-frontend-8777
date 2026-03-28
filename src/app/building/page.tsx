"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BennettSVGMap from "@/components/map/BennettSVGMap";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { useVoiceCommandContext } from "@/components/voice/VoiceCommandProvider";
import api from "@/lib/api";

function IndoorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAccessibilityProfile();
  const { speak } = useVoiceCommandContext();

  const routeTo = searchParams.get("routeTo");
  const isDemo = searchParams.get("demo") === "true";
  const requestedFloor = searchParams.get("floor");
  const reportObstacle = searchParams.get("reportObstacle") === "true";

  const [activeFloor, setActiveFloor] = useState(0);

  // Sync floor from URL
  useEffect(() => {
    if (requestedFloor) {
      const f = parseInt(requestedFloor, 10);
      if (f >= 0 && f <= 2) {
        setActiveFloor(f);
      }
    }
  }, [requestedFloor]);

  // AI Tool Listener for Floor Switching
  useEffect(() => {
    const handleTool = (e: any) => {
      const { tool, args } = e.detail;
      if (tool === "switch_floor" && args.floor !== undefined) {
        const f = parseInt(args.floor);
        if (f >= 0 && f <= 2) {
          setActiveFloor(f);
          speak(`Switching to floor ${f === 0 ? "ground" : f}.`, "polite");
        }
      }
    };
    window.addEventListener("navai-tool", handleTool);
    return () => window.removeEventListener("navai-tool", handleTool);
  }, [speak]);

  // Provide initial welcome voice prompt or route confirmation
  useEffect(() => {
    if (routeTo) {
      speak(`Routing to ${routeTo}. Follow the blue dashed line.`, "assertive");
    } else if (isDemo) {
      speak("Starting demo simulation.", "assertive");
    } else if (reportObstacle) {
      speak("Obstacle reporting open.", "assertive");
    } else {
      speak("Welcome to the Bennett University indoor map block A. You are at the main entrance.", "polite");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeTo, isDemo, reportObstacle]);

  return (
    <div style={{ minHeight: "calc(100vh - 73px)", background: "#0f172a", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Dynamic header / Top bar */}
      <div style={{ padding: "1rem 2rem", background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Nav<span style={{ color: "#3b82f6" }}>AI</span> Indoor</h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>Bennett University — Block A | {profile} Profile</p>
        </div>
        <button onClick={() => router.push("/")} style={{ background: "transparent", border: "1px solid #3b82f6", color: "#3b82f6", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
          Exit to Dashboard
        </button>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Floor Switcher */}
        <div style={{ display: "flex", justifyContent: "center", padding: "1rem", gap: "0.5rem", background: "#1e293b", zIndex: 10 }}>
          {[0, 1, 2].map(f => (
            <button
              key={f}
              onClick={() => setActiveFloor(f)}
              style={{
                padding: "0.5rem 1.5rem", borderRadius: "20px", border: "none", cursor: "pointer",
                background: activeFloor === f ? "#3b82f6" : "rgba(255,255,255,0.1)",
                color: activeFloor === f ? "white" : "#94a3b8", fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              {f === 0 ? "Ground" : `Floor ${f}`}
            </button>
          ))}
        </div>

        {/* Indoor Map SVG Component */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <BennettSVGMap 
            activeFloor={activeFloor} 
            setActiveFloor={setActiveFloor} 
            routeTo={routeTo || undefined} 
            isDemo={isDemo} 
            reportObstacleOpen={reportObstacle}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}

export default function IndoorPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", color: "white" }}>Loading indoor map...</div>}>
      <IndoorContent />
    </Suspense>
  );
}
