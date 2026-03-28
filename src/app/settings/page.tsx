"use client";

import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { profile, setProfile } = useAccessibilityProfile();
  const router = useRouter();

  const profiles = ["Blind / Low Vision", "Deaf / Hard of Hearing", "Wheelchair / Mobility", "Multiple / Other"];

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Settings</h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>
        Accessibility settings and profile configuration.
      </p>

      {/* Profile Selector */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Accessibility Profile</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {profiles.map(p => (
            <button
              key={p}
              onClick={() => setProfile(p)}
              style={{
                padding: "1rem",
                textAlign: "left",
                borderRadius: "8px",
                border: profile === p ? "2px solid #3b82f6" : "1px solid var(--border)",
                background: profile === p ? "#3b82f622" : "var(--bg-elevated)",
                cursor: "pointer",
                fontWeight: profile === p ? "bold" : "normal",
              }}
            >
              {profile === p ? "✓ " : ""}{p}
            </button>
          ))}
        </div>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
          Active: <strong>{profile}</strong>
        </p>
      </div>

      {/* Feature Tour */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <h3>Help & Tutorials</h3>
        <p style={{ color: "var(--fg-muted)", marginBottom: "1rem" }}>Replay the onboarding tutorial to learn how to use NavAI.</p>
        <button 
          onClick={() => {
            localStorage.removeItem("navai_setup_complete");
            router.push("/onboarding");
          }}
          style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", fontWeight: "bold", cursor: "pointer" }}
        >
          Start Feature Tour
        </button>
      </div>

      {/* Navigation */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginTop: "2rem" }}>
        <button onClick={() => router.push("/")} style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", cursor: "pointer" }}>
          ← Back to Map
        </button>
      </div>
    </div>
  );
}
