"use client";

import { useRouter } from "next/navigation";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { useEffect, useCallback } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { setProfile } = useAccessibilityProfile();

  const handleDemologin = useCallback((role: "blind" | "wheelchair" | "deaf" | "admin" | "standard") => {
    // 1. Save dummy user session bypassing Clerk
    localStorage.setItem("navai_user_session", JSON.stringify({ role, id: "demo_user" }));
    
    // 2. Automatically configure their accessibility profile!
    if (role !== "admin") {
      setProfile(role);
    } else {
      setProfile("standard");
    }

    // 3. Mark setup as incomplete if not admin so they go through onboarding, else skip to admin panel
    if (role === "admin") {
      localStorage.setItem("navai_setup_complete", "true");
      router.push("/admin");
    } else {
      router.push("/onboarding");
    }
  }, [router, setProfile]);

  useEffect(() => {
    const handleVoiceLogin = (e: any) => {
      const p = e.detail?.profile?.toLowerCase();
      if (p === "blind" || p === "wheelchair" || p === "deaf" || p === "standard") {
        handleDemologin(p as any);
      }
    };
    window.addEventListener("navai-profile-change", handleVoiceLogin);
    return () => window.removeEventListener("navai-profile-change", handleVoiceLogin);
  }, [handleDemologin]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "2rem"
    }}>
      <div style={{ textAlign: "center", maxWidth: "600px", width: "100%" }}>
        <h1 style={{ color: "white", fontSize: "3rem", marginBottom: "0.25rem", fontWeight: 800 }}>
          Nav<span style={{ color: "#3b82f6" }}>AI</span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: "3rem" }}>
          Fully Autonomous Accessible Navigation Platform
        </p>
        
        <p style={{ color: "white", marginBottom: "1.5rem", fontWeight: 600 }}>
          Select a Showcase User Profile:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button 
            onClick={() => handleDemologin("blind")}
            style={btnStyle}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "1.5rem" }}>🧑‍🦯</span> 
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Blind User Profile</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 400 }}>High Contrast, Voice-First enabled</div>
            </div>
          </button>

          <button 
            onClick={() => handleDemologin("wheelchair")}
            style={btnStyle}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "1.5rem" }}>♿</span> 
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Wheelchair User Profile</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 400 }}>Ramp routing, Lift-priority enabled</div>
            </div>
          </button>

          <button 
            onClick={() => handleDemologin("deaf")}
            style={btnStyle}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "1.5rem" }}>🧏</span> 
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Deaf User Profile</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 400 }}>Visual warnings, Haptic feedback enabled</div>
            </div>
          </button>

          <button 
            onClick={() => handleDemologin("admin")}
            style={{ ...btnStyle, background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.3)", color: "#fca5a5" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "1.5rem" }}>🛡️</span> 
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Security / Admin Access</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 400 }}>Manage hazards, Edit system scores</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "1.25rem 1.5rem",
  borderRadius: "16px",
  color: "white",
  display: "flex",
  alignItems: "center",
  gap: "1.25rem",
  cursor: "pointer",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  backdropFilter: "blur(12px)"
};
