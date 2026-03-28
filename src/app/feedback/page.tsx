"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";
import { useVoiceCommandContext } from "@/components/voice/VoiceCommandProvider";
import { useAssistant } from "@/contexts/AssistantContext";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("obstacle");
  const [status, setStatus] = useState("idle");
  const router = useRouter();
  const { speak } = useVoiceCommandContext();
  const { isWheelchair, triggerVibration } = useAccessibilityProfile();
  const { highlightedFields } = useAssistant();
  const formRef = useRef<HTMLFormElement>(null);

  // Listen for AI fill-field events
  useEffect(() => {
    const handleFillField = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.field) return;

      switch (detail.field) {
        case "name":
          setName(detail.value || "");
          break;
        case "email":
          setEmail(detail.value || "");
          break;
        case "message":
        case "text":
        case "description":
          setText(detail.value || "");
          break;
        case "category":
          setCategory(detail.value || "obstacle");
          break;
      }
    };

    const handleAppendField = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.field) return;

      switch (detail.field) {
        case "message":
        case "text":
        case "description":
          setText(prev => prev + (detail.value || ""));
          break;
      }
    };

    const handleSubmitForm = () => {
      // Trigger form submission programmatically
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    };

    window.addEventListener("navai-fill-field", handleFillField);
    window.addEventListener("navai-append-field", handleAppendField);
    window.addEventListener("navai-submit-form", handleSubmitForm);

    return () => {
      window.removeEventListener("navai-fill-field", handleFillField);
      window.removeEventListener("navai-append-field", handleAppendField);
      window.removeEventListener("navai-submit-form", handleSubmitForm);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      speak("Please provide a description before submitting.", "assertive");
      return;
    }
    setStatus("submitting");
    try {
      await api.post("/api/feedback/", {
        text,
        category,
        latitude: 37.7749,
        longitude: -122.4194
      });
      setStatus("success");
      triggerVibration();
      speak("Thank you. Your feedback has been submitted successfully.", "assertive");
      setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      speak("Sorry, there was an error submitting your feedback.");
    }
  };

  const getFieldHighlightStyle = (fieldName: string): React.CSSProperties => {
    if (highlightedFields.includes(fieldName)) {
      return {
        boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.2)",
        borderColor: "#6366f1",
        transition: "all 0.3s ease",
      };
    }
    return {};
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Submit Feedback</h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>Report obstacles or issues to improve NavAI routing for everyone.</p>

      {status === "success" ? (
        <div style={{ padding: "2rem", background: "#16a34a", color: "white", borderRadius: "8px", textAlign: "center" }}>
          <h2 style={{ marginBottom: "1rem" }}>Feedback securely submitted!</h2>
          <p>Redirecting to home map...</p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Name field */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Your Name (optional)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name..."
              style={{ 
                width: "100%", padding: "0.75rem", borderRadius: "8px", 
                border: "1px solid var(--border)", background: "var(--bg-elevated)", 
                color: "var(--fg)", fontFamily: "inherit",
                ...getFieldHighlightStyle("name"),
              }}
            />
          </div>

          {/* Email field */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Email (optional)</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              style={{ 
                width: "100%", padding: "0.75rem", borderRadius: "8px", 
                border: "1px solid var(--border)", background: "var(--bg-elevated)", 
                color: "var(--fg)", fontFamily: "inherit",
                ...getFieldHighlightStyle("email"),
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>What are you reporting?</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ 
                width: "100%", padding: "0.75rem", borderRadius: "8px", 
                border: "1px solid var(--border)", background: "var(--bg-elevated)", 
                color: "var(--fg)",
                ...getFieldHighlightStyle("category"),
              }}
            >
              <option value="obstacle">Physical Obstacle (e.g., stairs, construction)</option>
              <option value="broken_infrastructure">Broken Infrastructure (e.g., broken elevator)</option>
              <option value="infrastructure">Infrastructure Issue (e.g., lift not working)</option>
              <option value="app_issue">App Issue (e.g., wrong directions)</option>
              <option value="suggestion">General Suggestion</option>
            </select>
          </div>

          {/* Message / Description */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Description</label>
            <textarea 
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe the issue in detail... or say 'fill the feedback form for me' to let the AI write it."
              rows={6}
              required
              style={{ 
                width: "100%", padding: "0.75rem", borderRadius: "8px", 
                border: "1px solid var(--border)", background: "var(--bg-elevated)", 
                color: "var(--fg)", fontFamily: "inherit", lineHeight: 1.6,
                resize: "vertical",
                ...getFieldHighlightStyle("message"),
              }}
            />
          </div>

          {isWheelchair && (
            <p style={{ color: "#3b82f6", fontSize: "0.9rem", marginTop: "-0.5rem" }}>* Active Wheelchair Profile automatically attaches accessible routing priority metrics to this report.</p>
          )}

          {/* AI Hint */}
          <div style={{ 
            padding: "12px 16px", borderRadius: "10px", 
            background: "rgba(99, 102, 241, 0.08)", 
            border: "1px solid rgba(99, 102, 241, 0.15)",
            fontSize: "0.85rem", color: "#a78bfa",
          }}>
            ✨ <strong>AI Assistant:</strong> Say &quot;fill the feedback form for me&quot; or &quot;write an obstacle report for the broken ramp&quot; to let the AI write it for you.
          </div>

          <button 
            type="submit" 
            disabled={status === "submitting"}
            style={{ 
              padding: "1rem", 
              background: status === "error" ? "#dc2626" : "#3b82f6", 
              color: "white", borderRadius: "8px", border: "none", 
              fontWeight: "bold", cursor: "pointer", 
              opacity: status === "submitting" ? 0.7 : 1 
            }}
          >
            {status === "submitting" ? "Submitting securely..." : status === "error" ? "Retry Submission" : "Submit Report"}
          </button>
        </form>
      )}
    </div>
  );
}
