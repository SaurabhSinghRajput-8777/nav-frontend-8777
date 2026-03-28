"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useVoiceCommandContext } from "@/components/voice/VoiceCommandProvider";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";

export default function HomePage() {
  const router = useRouter();
  const { speak } = useVoiceCommandContext();
  const { profile } = useAccessibilityProfile();
  const contactRef = useRef<HTMLDivElement>(null);

  // Feedback form state
  const [fbName, setFbName] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbCategory, setFbCategory] = useState("suggestion");
  const [fbMessage, setFbMessage] = useState("");
  const [fbStatus, setFbStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbStatus("submitting");
    try {
      await api.post("/api/feedback/", {
        text: `[${fbName}] [${fbEmail}] ${fbMessage}`,
        category: fbCategory,
        latitude: 0,
        longitude: 0,
      });
      setFbStatus("success");
      speak("Thank you! Your feedback has been submitted successfully.", "assertive");
      setFbName(""); setFbEmail(""); setFbMessage("");
    } catch {
      setFbStatus("error");
      speak("Sorry, there was an error submitting your feedback.");
    }
  };

  const handleLogout = () => {
    speak("Goodbye! Logging you out now.");
    localStorage.removeItem("navai_authenticated");
    localStorage.removeItem("navai_guest_mode");
    setTimeout(() => router.push("/login"), 1500);
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
    speak("Here are the contact details for Team PathX from Bennett University.");
  };

  const quickCards = [
    { icon: "🗺️", title: "Delhi Navigation", desc: "Get accessible outdoor directions", href: "/navigate", color: "#3b82f6" },
    { icon: "🏢", title: "Indoor Map", desc: "Navigate Bennett University", href: "/building", color: "#6366f1" },
    { icon: "♿", title: "My Profile", desc: `Active: ${profile}`, href: "/settings", color: "#8b5cf6" },
    { icon: "📝", title: "Feedback", desc: "Report obstacles or suggest improvements", href: "/feedback", color: "#f59e0b" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white" }}>
      {/* ====== HERO ====== */}
      <section style={{
        textAlign: "center", padding: "5rem 2rem 4rem",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🧭</div>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "0.75rem", lineHeight: 1.2 }}>
          Welcome to Nav<span style={{ color: "#3b82f6" }}>AI</span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
          AI-powered navigation designed for accessibility. Voice-controlled, wheelchair-friendly, and intelligent.
        </p>
        <button
          onClick={() => router.push("/navigate")}
          style={{
            padding: "1rem 2.5rem", borderRadius: "12px", background: "#3b82f6", color: "white",
            border: "none", fontWeight: 700, fontSize: "1.15rem", cursor: "pointer",
            boxShadow: "0 8px 30px rgba(59,130,246,0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(59,130,246,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(59,130,246,0.4)"; }}
        >
          🚀 Start Navigating
        </button>
      </section>

      {/* ====== QUICK ACCESS CARDS ====== */}
      <section style={{ padding: "3rem 2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem", textAlign: "center" }}>Quick Access</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {quickCards.map(card => (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              style={{
                background: "rgba(30,41,59,0.6)", border: `1px solid ${card.color}33`,
                borderRadius: "16px", padding: "1.5rem", textAlign: "left",
                cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: `0 4px 20px ${card.color}11`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${card.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${card.color}11`; }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{card.icon}</div>
              <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{card.title}</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.5 }}>{card.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ====== FEEDBACK FORM ====== */}
      <section style={{ padding: "3rem 2rem", maxWidth: "700px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Share Your Experience</h2>
        <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: "2rem" }}>Your feedback helps us improve accessible navigation for everyone.</p>

        {fbStatus === "success" ? (
          <div style={{ padding: "2rem", background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: "12px", textAlign: "center" }}>
            <h3 style={{ color: "#4ade80", marginBottom: "0.5rem" }}>✓ Thank You!</h3>
            <p style={{ color: "#94a3b8" }}>Your feedback has been recorded and will help improve NavAI.</p>
            <button onClick={() => setFbStatus("idle")} style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer" }}>Submit Another</button>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 600 }}>Name</label>
                <input value={fbName} onChange={e => setFbName(e.target.value)} placeholder="Your name" required
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.95rem", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 600 }}>Email</label>
                <input value={fbEmail} onChange={e => setFbEmail(e.target.value)} type="email" placeholder="you@email.com" required
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.95rem", outline: "none" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 600 }}>Category</label>
              <select value={fbCategory} onChange={e => setFbCategory(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.95rem" }}
              >
                <option value="suggestion">Suggestion</option>
                <option value="obstacle">Obstacle Report</option>
                <option value="broken_infrastructure">Broken Infrastructure</option>
                <option value="app_issue">App Issue</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 600 }}>Message</label>
              <textarea value={fbMessage} onChange={e => setFbMessage(e.target.value)} rows={4} placeholder="Describe your experience or report an issue..." required
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical", outline: "none" }}
              />
            </div>

            <button type="submit" disabled={fbStatus === "submitting"}
              style={{
                padding: "0.875rem", borderRadius: "10px",
                background: fbStatus === "error" ? "#dc2626" : "#3b82f6",
                color: "white", border: "none", fontWeight: 700, fontSize: "1rem",
                cursor: "pointer", opacity: fbStatus === "submitting" ? 0.7 : 1,
                transition: "background 0.2s",
              }}
            >
              {fbStatus === "submitting" ? "Submitting..." : fbStatus === "error" ? "Retry" : "Submit Feedback"}
            </button>
          </form>
        )}
      </section>

      {/* ====== CONTACT SECTION ====== */}
      <section ref={contactRef} id="contact" style={{
        padding: "4rem 2rem", borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(15,23,42,0.5)",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Contact Us</h2>
          <p style={{ color: "#64748b", marginBottom: "2.5rem" }}>Meet the team behind NavAI</p>

          <div style={{
            background: "rgba(30,41,59,0.6)", borderRadius: "16px", padding: "2rem",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <h3 style={{ color: "#3b82f6", fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.25rem" }}>Team PathX</h3>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>Bennett University</p>

            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              {["Divya Saini", "Palak Aggarwal", "Shivang Tayal"].map(name => (
                <div key={name} style={{
                  background: "rgba(59,130,246,0.1)", borderRadius: "12px", padding: "1rem 1.5rem",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                    {name[0]}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{name}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", color: "#94a3b8", fontSize: "0.9rem" }}>
              <a href="mailto:navai@bennett.edu.in" style={{ color: "#60a5fa", textDecoration: "none" }}>📧 navai@bennett.edu.in</a>
              <a href="https://github.com/pathx-navai" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>🔗 GitHub</a>
              <a href="#" style={{ color: "#60a5fa", textDecoration: "none" }}>🐦 Twitter</a>
              <a href="#" style={{ color: "#60a5fa", textDecoration: "none" }}>💼 LinkedIn</a>
            </div>
          </div>

          <p style={{ color: "#475569", fontSize: "0.8rem", marginTop: "2rem" }}>
            🎤 Say &quot;contact the team&quot; to scroll here and hear details read aloud
          </p>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#475569", fontSize: "0.8rem" }}>
        © 2026 NavAI by Team PathX, Bennett University. All rights reserved.
      </footer>
    </div>
  );
}
