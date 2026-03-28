"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useVoiceCommandContext } from "@/components/voice/VoiceCommandProvider";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { useNavigation, RouteStep } from "@/contexts/NavigationContext";
import MapView from "@/components/map/MapView";

function NavigateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const destination = searchParams.get("to") || "";
  
  const { steps, currentStepIndex, isActive: isConfirmed, setNavigation, clearNavigation, setCurrentStep } = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { speak } = useVoiceCommandContext();
  const { isWheelchair, triggerVibration } = useAccessibilityProfile();

  useEffect(() => {
    if (!destination) {
      if (isConfirmed) clearNavigation();
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/routes/directions", {
          params: {
            origin: "current_location",
            destination,
            wheelchair: isWheelchair,
            avoid_stairs: isWheelchair,
          },
        });

        const data = res.data;
        let fetchedSteps: RouteStep[] = [];

        if (data.steps) {
          fetchedSteps = data.steps;
        } else if (data.instructions) {
          fetchedSteps = data.instructions.map((inst: string) => ({
            instruction: inst,
            distance: "",
            duration: "",
          }));
        } else {
          fetchedSteps = [{ 
            instruction: data.message || "Route loaded.", 
            distance: data.total_distance || "", 
            duration: data.estimated_duration || "" 
          }];
        }

        setNavigation(destination, fetchedSteps);
        speak(`Route found to ${destination}. ${fetchedSteps.length} steps.`);
        triggerVibration();
      } catch (err: any) {
        setError("Could not fetch route. Backend may be offline.");
        speak("Sorry, I could not fetch directions right now.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [destination, isWheelchair, speak, triggerVibration, setNavigation, clearNavigation]);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 73px)", overflow: "hidden", background: "#0f172a" }}>
      {/* Fullscreen Map View */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <MapView />
      </div>

      {/* Floating Glassmorphic Instruction Card */}
      <div 
        id="nav-instructions-card"
        style={{
          position: "absolute", top: "1.5rem", right: "1.5rem", zIndex: 10,
          width: "320px", 
          maxHeight: "85vh",
          background: isConfirmed ? "rgba(6, 78, 59, 0.9)" : "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: isConfirmed ? "2px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: isConfirmed ? "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.2)" : "0 20px 50px rgba(0, 0, 0, 0.5)",
          padding: "1.5rem",
          display: "flex", flexDirection: "column", gap: "1.2rem",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ 
            margin: 0, fontSize: "1.1rem", fontWeight: 800, 
            color: isConfirmed ? "#10b981" : "white",
            display: "flex", alignItems: "center", gap: "10px",
            letterSpacing: "0.5px"
          }}>
            {isConfirmed ? (
              <>
                <span style={{ animation: "pulse-green 1.5s infinite", width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                ACTIVE ROUTE
              </>
            ) : "NAVIGATION"}
          </h2>
          {isWheelchair && <span title="Wheelchair Accessible" style={{ fontSize: "1.1rem" }}>♿</span>}
        </div>

        {/* Content Area */}
        <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {!destination ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🧭</div>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
                Search for a building or ask <br/>
                <span style={{ color: "#3b82f6", fontWeight: 700 }}>"Navigate to..."</span>
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {loading ? (
                 <div style={{ textAlign: "center", padding: "1rem" }}>
                    <div className="spinner" style={{ margin: "0 auto 1rem" }} />
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Calculating best route...</p>
                 </div>
              ) : error ? (
                 <div style={{ padding: "1rem", background: "rgba(220,38,38,0.1)", borderRadius: "12px", border: "1px solid rgba(220,38,38,0.2)", color: "#f87171", fontSize: "0.85rem" }}>
                   {error}
                 </div>
              ) : (
                <>
                  <div style={{ padding: "12px 16px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "14px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#34d399", fontWeight: 800, textTransform: "uppercase" }}>Destination</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "1.1rem", color: "white", fontWeight: 700 }}>{destination}</p>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                    {steps.map((step, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCurrentStep(i)}
                        style={{
                          padding: "12px", 
                          background: currentStepIndex === i ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.03)", 
                          borderRadius: "14px",
                          border: currentStepIndex === i ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.06)", 
                          display: "flex", gap: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ 
                          width: "24px", height: "24px", borderRadius: "50%", 
                          background: currentStepIndex === i ? "#10b981" : "rgba(255,255,255,0.1)", 
                          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 800, flexShrink: 0
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "white", lineHeight: 1.5 }}>{step.instruction}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {destination && !loading && (
          <button 
            onClick={() => {
               clearNavigation();
               router.push("/navigate");
            }}
            style={{
              width: "100%", padding: "12px", borderRadius: "14px",
              background: "rgba(239, 68, 68, 0.15)", color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)", fontWeight: 700,
              cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s"
            }}
          >
            End Navigation
          </button>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scroll::-webkit-scrollbar { width: 3px; }
          .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top: 2px solid #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @media (max-width: 768px) {
            #nav-instructions-card {
              width: calc(100% - 2rem) !important;
              max-height: 40vh !important;
              top: auto !important;
              bottom: 1rem !important;
              left: 1rem !important;
              right: 1rem !important;
            }
          }
        ` }} />
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div style={{ width: "100%", height: "calc(100vh - 73px)", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading navigation...</div>}>
      <NavigateContent />
    </Suspense>
  );
}
