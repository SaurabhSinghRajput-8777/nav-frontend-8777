"use client";

import { useState, useRef, useEffect } from "react";
import { useAssistant } from "@/contexts/AssistantContext";
import Logo from "../ui/Logo";

export default function AssistantPanel() {
  const {
    messages, isOpen, isThinking, report, listItems,
    sendInstruction, togglePanel, closePanel, clearSession,
    dismissReport, dismissList,
  } = useAssistant();

  const [textInput, setTextInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput("");
    sendInstruction(text);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const readAloud = (text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.lang = "en-US";
      speechSynthesis.speak(u);
    }
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick action chips for common tasks
  const quickActions = [
    "Fill the feedback form for me",
    "List all issues in this building",
    "Do an accessibility audit",
    "Write an obstacle report",
  ];

  return (
    <>
      {/* ======= COLLAPSED: Floating Assistant Button ======= */}
      <button
        onClick={togglePanel}
        aria-label="Open AI Assistant"
        id="ai-assistant-toggle"
        style={{
          position: "fixed", bottom: "24px", left: "24px",
          zIndex: "var(--z-voice-chip, 600)",
          display: "flex", alignItems: "center", gap: "8px",
          padding: isOpen ? "8px" : "12px 18px",
          background: "linear-gradient(135deg, #7c3aed, #6366f1)",
          color: "white", border: "none", borderRadius: "28px",
          cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
          transition: "all 0.3s ease",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          transform: isOpen ? "scale(0.8)" : "scale(1)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        AI Assistant
        {isThinking && (
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fbbf24", animation: "pulse-dot 1s infinite" }} />
        )}
      </button>

      {/* ======= EXPANDED: Side Panel ======= */}
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          onClick={closePanel}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 799,
            display: "none",
          }}
          className="assistant-backdrop"
        />
      )}

      <div
        role="complementary"
        aria-label="AI Assistant Panel"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: "360px", maxWidth: "100vw",
          zIndex: "var(--z-modal, 800)",
          background: "rgba(15, 23, 42, 0.97)",
          backdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(99, 102, 241, 0.2)",
          display: "flex", flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isOpen ? "8px 0 40px rgba(0,0,0,0.3)" : "none",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Logo size="sm" />
            </div>
            <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>NavAI Assistant</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={clearSession} title="Clear session"
              style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}>
              Clear
            </button>
            <button onClick={closePanel} title="Close"
              style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "1rem" }}>
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: "12px",
        }}>
          {messages.length === 0 && !isThinking && (
            <div style={{ textAlign: "center", padding: "32px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✨</div>
              <p style={{ fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                AI Assistant Ready
              </p>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "16px" }}>
                Ask me to write reports, fill forms, list issues, do audits, or describe buildings. Try saying &quot;write an obstacle report&quot; or type below.
              </p>
              {/* Quick action chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                {quickActions.map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => sendInstruction(action)}
                    style={{
                      padding: "6px 12px", borderRadius: "16px",
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      color: "#a78bfa", fontSize: "0.75rem",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}>
              <div style={{
                padding: "10px 14px", borderRadius: "12px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                  : "rgba(255,255,255,0.06)",
                color: "white", fontSize: "0.9rem", lineHeight: 1.5,
              }}>
                {msg.content}
              </div>
              {/* Show action badges */}
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                  {msg.actions.map((a, j) => (
                    <span key={j} style={{
                      fontSize: "0.65rem", padding: "2px 8px", borderRadius: "4px",
                      background: "rgba(99, 102, 241, 0.2)", color: "#a78bfa",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                    }}>
                      {a.type}{a.field ? `: ${a.field}` : ""}
                    </span>
                  ))}
                </div>
              )}
              {/* Follow-up question */}
              {msg.followUp && (
                <div style={{
                  marginTop: "8px", padding: "8px 12px", borderRadius: "8px",
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  fontSize: "0.8rem", color: "#c4b5fd",
                }}>
                  {msg.followUp}
                </div>
              )}
              {/* Copy/Read buttons for assistant messages */}
              {msg.role === "assistant" && msg.content.length > 50 && (
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button 
                    onClick={() => copyToClipboard(msg.content)} 
                    style={{ ...btnSmall, fontSize: "0.65rem" }}
                  >
                    📋 Copy
                  </button>
                  <button 
                    onClick={() => readAloud(msg.content)} 
                    style={{ ...btnSmall, fontSize: "0.65rem" }}
                  >
                    🔊 Read
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div style={{
              alignSelf: "flex-start", padding: "10px 14px",
              background: "rgba(255,255,255,0.06)", borderRadius: "12px",
              display: "flex", gap: "4px", alignItems: "center",
            }}>
              <span className="dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
              <span className="dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animationDelay: "0.2s" }} />
              <span className="dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animationDelay: "0.4s" }} />
              <span style={{ color: "#94a3b8", fontSize: "0.8rem", marginLeft: "6px" }}>AI is working...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex", gap: "8px",
        }}>
          <input
            ref={inputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the AI assistant..."
            disabled={isThinking}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "white",
              fontSize: "0.9rem", outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={isThinking || !textInput.trim()}
            style={{
              padding: "10px 16px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "white", cursor: "pointer", fontWeight: 600,
              opacity: isThinking || !textInput.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* ======= Report Modal ======= */}
      {report && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 900,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: "#1e293b", borderRadius: "16px", width: "100%", maxWidth: "640px",
            maxHeight: "80vh", display: "flex", flexDirection: "column",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>📄 AI Generated Report</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => copyToClipboard(report)} style={btnSmall}>📋 Copy</button>
                <button onClick={() => readAloud(report)} style={btnSmall}>🔊 Read</button>
                <button onClick={() => downloadAsText(report, "navai-report.txt")} style={btnSmall}>⬇ Download</button>
                <button onClick={dismissReport} style={btnSmall}>✕</button>
              </div>
            </div>
            <div style={{ padding: "20px", overflowY: "auto", color: "#e2e8f0", fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {report}
            </div>
          </div>
        </div>
      )}

      {/* ======= List Modal ======= */}
      {listItems && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 900,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: "#1e293b", borderRadius: "16px", width: "100%", maxWidth: "540px",
            maxHeight: "80vh", display: "flex", flexDirection: "column",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>📋 Issues List</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => {
                    const text = listItems.map(item => `${item.title}: ${item.detail}`).join("\n");
                    copyToClipboard(text);
                  }} 
                  style={btnSmall}
                >
                  📋 Copy All
                </button>
                <button 
                  onClick={() => {
                    const text = listItems.map(item => `${item.title}. ${item.detail}`).join(". ");
                    readAloud(text);
                  }} 
                  style={btnSmall}
                >
                  🔊 Read
                </button>
                <button onClick={dismissList} style={btnSmall}>✕</button>
              </div>
            </div>
            <div style={{ padding: "12px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {listItems.map((item, i) => (
                <div key={i} style={{
                  padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                >
                  <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>{item.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "4px" }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .dot-bounce {
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @media (max-width: 768px) {
          .assistant-backdrop { display: block !important; }
        }
      `}</style>
    </>
  );
}

const btnSmall: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)", border: "none",
  color: "#94a3b8", padding: "4px 10px", borderRadius: "6px",
  cursor: "pointer", fontSize: "0.75rem",
};
