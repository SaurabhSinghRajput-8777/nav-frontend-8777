"use client";

import { createContext, useContext, ReactNode, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlwaysOnVoice, NLPResult } from "../../hooks/useVoiceCommand";
import { useSpeak } from "../../hooks/useSpeak";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { useAssistant } from "@/contexts/AssistantContext";
import VoiceIndicator from "./VoiceIndicator";

interface VoiceEngineContextType {
  isActive: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isReconnecting: boolean;
  isAssistantWorking: boolean;
  interimTranscript: string;
  lastTranscript: string;
  lastAIResponse: string;
  speak: (text: string, priority?: "assertive" | "polite") => void;
}

const VoiceEngineContext = createContext<VoiceEngineContextType | null>(null);

export function useVoiceCommandContext() {
  const ctx = useContext(VoiceEngineContext);
  if (!ctx) throw new Error("useVoiceCommandContext must be used within VoiceCommandProvider");
  return ctx;
}

export default function VoiceCommandProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { speak } = useSpeak();
  const { setProfile, triggerVibration } = useAccessibilityProfile();
  const { sendInstruction, openPanel, isThinking } = useAssistant();

  const [lastAIResponse, setLastAIResponse] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<NLPResult | null>(null);

  // Called when voice detects an AI assistant trigger phrase
  const handleAssistantTrigger = useCallback((text: string) => {
    openPanel();
    sendInstruction(text);
  }, [openPanel, sendInstruction]);

  const handleNLPResult = useCallback((result: NLPResult) => {
    if (result.requires_confirmation) {
      setPendingAction(result);
      speak(result.spoken_response, "assertive");
      setLastAIResponse(result.spoken_response);
      return;
    }

    setLastAIResponse(result.spoken_response);
    speak(result.spoken_response, "assertive");

    const action = result.action;
    switch (action.type) {
      case "GO_BACK":
        router.back();
        break;
      case "NAVIGATE_TO":
      case "GO_TO_PAGE":
        if (action.payload.destination) {
          router.push(`/navigate?dest=${encodeURIComponent(action.payload.destination)}`);
        } else if (action.payload.page) {
          router.push(action.payload.page);
        }
        break;
      case "NAVIGATE_INDOOR":
        router.push("/building");
        break;
      case "CHANGE_FLOOR":
        break;
      case "OPEN_FEEDBACK":
        router.push("/feedback");
        break;
      case "CHANGE_SETTING":
        if (action.payload.profile) {
          setProfile(action.payload.profile);
        }
        if (action.payload.setting === "high_contrast") {
          document.body.classList.toggle("high-contrast");
        }
        break;
      case "FILTER_MAP":
        break;
      case "REPEAT_LAST":
        speak(lastAIResponse || "I don't have a previous instruction to repeat", "assertive");
        break;
      case "SHOW_STATUS":
        speak("You are using the NavAI application.", "polite");
        break;
      case "SIGN_OUT":
        if (typeof window !== "undefined" && (window as any).Clerk) {
          (window as any).Clerk.signOut(() => router.push("/login"));
        } else {
          localStorage.removeItem("navai_authenticated");
          localStorage.removeItem("navai_guest_mode");
          router.push("/login");
        }
        break;
      case "START_DEMO":
        router.push("/building?demo=true");
        break;
      case "EMERGENCY_ALERT":
        triggerVibration([500, 200, 500, 200, 500]);
        break;
      case "CONFIRM":
        if (pendingAction) {
           handleNLPResult({ ...pendingAction, requires_confirmation: false, spoken_response: "Confirmed." });
           setPendingAction(null);
        }
        break;
      case "UNKNOWN":
      case "CLARIFY":
      case "SPEAK_INFO":
      default:
        break;
    }
  }, [router, speak, setProfile, triggerVibration, pendingAction, lastAIResponse]);

  const voice = useAlwaysOnVoice({
    onResult: handleNLPResult,
    onAssistantTrigger: handleAssistantTrigger,
  });

  const contextValue: VoiceEngineContextType = {
    isActive: voice.isActive,
    isSpeaking: voice.isSpeaking,
    isProcessing: voice.isProcessing,
    isReconnecting: voice.isReconnecting,
    isAssistantWorking: voice.isAssistantWorking || isThinking,
    interimTranscript: voice.interimTranscript,
    lastTranscript: voice.lastFinalTranscript,
    lastAIResponse,
    speak,
  };

  return (
    <VoiceEngineContext.Provider value={contextValue}>
      {children}
      
      {/* Fallback Overlay if autostart was blocked */}
      {voice.needsGesture && (
        <div 
          onClick={voice.activate}
          style={{
            position: "fixed", inset: 0, zIndex: 100000,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px",
            color: "white", cursor: "pointer"
          }}
        >
          <button 
            aria-label="Close voice activation overlay"
            onClick={(e) => { e.stopPropagation(); voice.dismissGestureReq(); }}
            style={{
              position: "absolute", top: "24px", right: "24px",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", 
              color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
              fontSize: "0.9rem", transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            Not Now
          </button>

          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)",
            animation: "pulse-big 2s infinite"
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, textAlign: "center" }}>
            Tap anywhere to activate NavAI Voice
          </h2>
          <p style={{ opacity: 0.7, maxWidth: "400px", textAlign: "center", fontSize: "1.1rem" }}>
            The browser requires interaction before we can listen. Once activated, voice navigation runs continuously.
          </p>
          <style>{`
            @keyframes pulse-big {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              70% { box-shadow: 0 0 0 40px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
          `}</style>
        </div>
      )}

      {/* Unsupported Fallback */}
      {voice.isUnsupported && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "12px", background: "#dc2626", color: "white", zIndex: 9999, textAlign: "center", fontWeight: "bold" }}>
          Please use Google Chrome for the best NavAI voice experience. Voice features are currently disabled.
        </div>
      )}

      {/* Persistent UI elements */}
      <VoiceIndicator
        isActive={voice.isActive}
        isSpeaking={voice.isSpeaking}
        isProcessing={voice.isProcessing}
        isReconnecting={voice.isReconnecting}
        isAssistantWorking={voice.isAssistantWorking || isThinking}
        interimTranscript={voice.interimTranscript}
        lastTranscript={voice.lastFinalTranscript}
        lastAIResponse={lastAIResponse}
        onToggle={() => {
          if (voice.isActive) voice.deactivate();
          else voice.activate();
        }}
      />
    </VoiceEngineContext.Provider>
  );
}
