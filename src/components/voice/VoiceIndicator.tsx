"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceIndicatorProps {
  isActive: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isReconnecting: boolean;
  isAssistantWorking: boolean;
  interimTranscript: string;
  lastTranscript: string;
  lastAIResponse: string;
  onToggle: () => void;
}

export default function VoiceIndicator({
  isActive,
  isSpeaking,
  isProcessing,
  isReconnecting,
  isAssistantWorking,
  interimTranscript,
  lastTranscript,
  lastAIResponse,
  onToggle,
}: VoiceIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show bottom bar whenever transcript or AI response updates
  useEffect(() => {
    if (interimTranscript || lastTranscript || lastAIResponse || isProcessing || isAssistantWorking) {
      setShowBottomBar(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (!isSpeaking && !isProcessing && !isAssistantWorking) {
          setShowBottomBar(false);
        }
      }, 4000);
    }
  }, [interimTranscript, lastTranscript, lastAIResponse, isSpeaking, isProcessing, isAssistantWorking]);

  // Waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    function drawWaveform() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      if (isSpeaking) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const bars = 15;
        const barWidth = width / bars;
        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * height * 0.8 + height * 0.1;
          const x = i * barWidth + barWidth / 2;
          const y = (height - barHeight) / 2;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + barHeight);
        }
        ctx.stroke();
      } else if (isActive) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(drawWaveform);
    }

    if (isActive) {
      drawWaveform();
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking, isActive]);

  return (
    <>
      {/* 1) TOP RIGHT CORNER: Status Chip */}
      {(isActive || isReconnecting) && (
        <div 
          style={{
            position: "fixed", top: "64px", right: "24px", zIndex: "var(--z-voice-chip)",
            display: "flex", alignItems: "center", gap: "10px",
            background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)",
            padding: "8px 16px", borderRadius: "30px",
            boxShadow: isAssistantWorking 
              ? "0 0 15px rgba(124, 58, 237, 0.5)" 
              : isSpeaking 
                ? "0 0 15px rgba(59, 130, 246, 0.5)" 
                : "0 4px 12px rgba(0,0,0,0.3)",
            border: isAssistantWorking 
              ? "1px solid rgba(124, 58, 237, 0.3)" 
              : "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.3s ease"
          }}
          className="voice-chip-container"
        >
        {isAssistantWorking ? (
          <>
            <div style={{ 
              width: "12px", height: "12px", borderRadius: "50%", 
              border: "2px solid rgba(124, 58, 237, 0.3)", 
              borderTopColor: "#7c3aed", 
              animation: "spin 1s linear infinite" 
            }} />
            <span style={{ color: "#c084fc", fontSize: "0.8rem", fontWeight: 600 }}>AI is working...</span>
          </>
        ) : isReconnecting ? (
          <>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", animation: "pulse-err 1.5s infinite" }} />
            <span style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 600 }}>Reconnecting...</span>
          </>
        ) : isProcessing ? (
          <>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid rgba(168, 85, 247, 0.3)", borderTopColor: "#a855f7", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "#d8b4fe", fontSize: "0.8rem", fontWeight: 600 }}>Thinking...</span>
          </>
        ) : (
          <>
            {!isSpeaking && (
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1.5s infinite" }} />
            )}
            {isSpeaking && (
              <canvas ref={canvasRef} width={40} height={16} style={{ display: "block" }} />
            )}
            <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 600 }}>
              {isSpeaking ? "" : "Listening"}
            </span>
          </>
        )}

        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
          @keyframes pulse-err {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            50% { opacity: 0.5; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      )}

      {/* 2) BOTTOM FLOATING BAR: Real-time Output */}
      <div 
        style={{
          position: "fixed", bottom: "calc(var(--bottom-sheet-height, 0px) + 80px)", left: "50%", transform: "translateX(-50%)",
          zIndex: "var(--z-transcript-bar)", width: "calc(100vw - 32px)", maxWidth: "480px",
          display: "flex", gap: "12px",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: showBottomBar ? 1 : 0,
          pointerEvents: showBottomBar ? "auto" : "none",
          transformOrigin: "bottom",
          translate: showBottomBar ? "0 0" : "0 20px"
        }}
        className="transcript-bar-container"
      >
        {/* User Transcript Side (Left) */}
        <div style={{
          flex: 1, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(12px)",
          padding: "16px 20px", borderRadius: "16px", border: "1px solid rgba(59, 130, 246, 0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}>
          <div style={{ fontSize: "0.7rem", color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            You Said
          </div>
          <div 
            aria-live="polite" 
            aria-atomic="true"
            style={{ color: "white", fontSize: "1.1rem", lineHeight: 1.4, minHeight: "24px" }}
          >
            {isSpeaking ? (
              <span style={{ opacity: 0.9 }}>{interimTranscript || "Listening..."}</span>
            ) : (
              <span>{lastTranscript}</span>
            )}
          </div>
        </div>

        {/* AI Response Side (Right) */}
        {(lastAIResponse || isProcessing || isAssistantWorking) && (
          <div style={{
            flex: 1, background: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(12px)",
            padding: "16px 20px", borderRadius: "16px", 
            border: isAssistantWorking 
              ? "1px solid rgba(124, 58, 237, 0.4)" 
              : "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: isAssistantWorking
              ? "0 8px 32px rgba(124, 58, 237, 0.2)"
              : "0 8px 32px rgba(168, 85, 247, 0.15)"
          }}>
             <div style={{ fontSize: "0.7rem", color: isAssistantWorking ? "#a78bfa" : "#c084fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              {isAssistantWorking ? "✨ AI Assistant" : "NavAI"}
            </div>
            <div 
              aria-live="assertive" 
              style={{ color: "white", fontSize: "1.05rem", lineHeight: 1.4 }}
            >
              {isAssistantWorking ? (
                <span className="pulse-text" style={{ color: "#c4b5fd" }}>AI is working...</span>
              ) : isProcessing ? (
                <span className="pulse-text" style={{ color: "#d8b4fe" }}>Processing request...</span>
              ) : (
                <span style={{ color: "#e9d5ff" }}>{lastAIResponse}</span>
              )}
            </div>
          </div>
        )}
        
        <style>{`
          .pulse-text { animation: pulse 1.5s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          @media (max-width: 640px) {
            .voice-chip-container span { display: none; }
            .voice-chip-container { padding: 8px; border-radius: 50%; }
            .transcript-bar-container > div { padding: 12px; }
            .transcript-bar-container > div > div:last-child { font-size: 12px !important; }
          }
        `}</style>
      </div>

      {/* 3) FLOATING MIC BUTTON */}
      <button 
        onClick={onToggle}
        aria-label={isActive ? "Stop listening" : "Start listening"}
        style={{
          position: "fixed", bottom: "calc(var(--bottom-sheet-height, 0px) + 24px)", right: "24px",
          zIndex: "var(--z-voice-chip)", width: "56px", height: "56px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isActive ? "var(--primary-600)" : "var(--bg-secondary)",
          color: isActive ? "white" : "var(--fg)",
          border: isActive ? "none" : "2px solid var(--border)",
          boxShadow: isActive ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "0 4px 12px rgba(0,0,0,0.1)",
          cursor: "pointer", transition: "all 0.3s ease",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isActive ? (
            <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></>
          ) : (
            <><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="22"></line></>
          )}
        </svg>
      </button>
    </>
  );
}
