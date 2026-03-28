"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVoiceCommandContext } from "@/components/voice/VoiceCommandProvider";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import api from "@/lib/api";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { speak } = useVoiceCommandContext();
  const { setProfile: setGlobalProfile } = useAccessibilityProfile();

  useEffect(() => {
    if (currentStep === 1) {
      speak("Welcome to Nav A I. Let's set up your accessibility profile.");
    }
  }, [currentStep, speak]);

  const handleSkip = () => {
    localStorage.setItem("navai_setup_complete", "true");
    router.push("/");
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleFinish = () => {
    localStorage.setItem("navai_setup_complete", "true");
    router.push("/");
  };

  const setProfile = async (profile: string) => {
    setGlobalProfile(profile);
    try {
      const username = localStorage.getItem("navai_username") || "guest_" + Math.random().toString(36).substring(7);
      localStorage.setItem("navai_username", username);
      await api.post("/api/users/profile", { username, disability_profile: profile });
    } catch (err) {
      console.error("Failed to sync profile:", err);
    }
    handleNext();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h2>Onboarding {currentStep}/6</h2>
        <button onClick={handleSkip} style={{ background: "none", border: "none", color: "var(--fg-muted)", cursor: "pointer", textDecoration: "underline" }}>
          Skip tutorial
        </button>
      </div>

      <div style={{ minHeight: "300px" }}>
        {currentStep === 1 && (
          <div>
            <h1>Welcome to NavAI</h1>
            <p>Your AI-powered accessible navigation assistant.</p>
            <p style={{ marginTop: "1rem", color: "var(--fg-muted)" }}>Voice feedback has been automatically initialized for this tutorial.</p>
            <button onClick={handleNext} style={{ marginTop: "2rem", padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>Start Setup</button>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h1>Select your profile</h1>
            <p style={{ marginBottom: "2rem" }}>This helps us tailor routes and instructions to your needs.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {["Blind / Low Vision", "Deaf / Hard of Hearing", "Wheelchair / Mobility", "Multiple / Other"].map((p) => (
                <button
                  key={p}
                  onClick={() => setProfile(p)}
                  style={{ padding: "1rem", textAlign: "left", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h1>Voice Commands</h1>
            <p>NavAI can be entirely controlled by voice.</p>
            <div style={{ marginTop: "2rem", padding: "2rem", background: "var(--bg-elevated)", borderRadius: "12px", textAlign: "center" }}>
              <p style={{ fontWeight: "bold", marginBottom: "1rem" }}>Hold the microphone icon to speak.</p>
              <p style={{ color: "var(--fg-muted)" }}>Try holding the mic at the bottom of your screen and saying "Help" or "Go to Settings".</p>
            </div>
            <button onClick={handleNext} style={{ marginTop: "2rem", padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>Continue</button>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h1>Navigation Demo</h1>
            <p>During navigation, you will receive turn-by-turn guidance and obstacle alerts.</p>
            <div style={{ marginTop: "2rem", padding: "1.5rem", borderLeft: "4px solid #3b82f6", background: "var(--bg-elevated)" }}>
              <p style={{ fontWeight: "bold" }}>"In 50 meters, turn right at the library entrance."</p>
              <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>Example voice instruction</p>
            </div>
            <button onClick={handleNext} style={{ marginTop: "2rem", padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>Continue</button>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h1>Submit Feedback</h1>
            <p>Help improve routes for everyone by reporting obstacles.</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "1rem", lineHeight: "1.8" }}>
              <li>Say <strong>"Report obstacle"</strong> anytime.</li>
              <li>Or tap the Feedback button in the menu.</li>
            </ul>
            <button onClick={handleNext} style={{ marginTop: "2rem", padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>Continue</button>
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <h1>You're All Set!</h1>
            <p>Your profile is configured and NavAI is ready to use.</p>
            <button onClick={handleFinish} style={{ marginTop: "2rem", padding: "1rem 2rem", borderRadius: "8px", background: "#16a34a", color: "white", border: "none", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}>Go to Map</button>
          </div>
        )}
      </div>
    </div>
  );
}
