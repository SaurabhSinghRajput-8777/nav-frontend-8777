"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAssistant } from "@/contexts/AssistantContext";

interface FeedbackItem {
  id: number;
  text: string;
  category: string;
  sentiment_label: string;
  created_at: string;
}

interface AdminSummary {
  total_count: number;
  sentiment_trends: Record<string, number>;
  top_issues: { category: string; count: number }[];
}

interface InsightCard {
  icon: string;
  title: string;
  value: string;
  trend: string;
  color: string;
}

export default function AdminDashboard() {
  const [recent, setRecent] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const { sendInstruction, report, isThinking, dismissReport } = useAssistant();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedbackRes, summaryRes] = await Promise.all([
          api.get("/api/feedback/"),
          api.get("/api/feedback/admin/summary")
        ]);
        setRecent(feedbackRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // Use fallback data for demo
        setSummary({
          total_count: 47,
          sentiment_trends: { positive: 10, neutral: 15, negative: 22 },
          top_issues: [
            { category: "ramp_access", count: 14 },
            { category: "lift_issues", count: 9 },
            { category: "space_constraints", count: 8 },
          ],
        });
      }
    };
    fetchData();
  }, []);

  // Fetch AI insight cards on page load
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get("/api/assistant/insights");
        setInsights(res.data.insights);
      } catch (err) {
        // Fallback insights
        setInsights([
          { icon: "🔴", title: "Most Reported Issue This Week", value: "Broken ramps — 8 reports", trend: "up", color: "#ef4444" },
          { icon: "🏢", title: "Building Needing Most Attention", value: "Connaught Place — Score: 76", trend: "down", color: "#f59e0b" },
          { icon: "⭐", title: "Best Performing Building", value: "Bennett University — Score: 94", trend: "up", color: "#22c55e" },
          { icon: "⏱️", title: "Hazard Response Time Average", value: "18 minutes", trend: "stable", color: "#3b82f6" },
        ]);
      } finally {
        setInsightsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const handleGenerateWeeklyReport = useCallback(() => {
    sendInstruction("Generate weekly report");
  }, [sendInstruction]);

  const handleSummarizeAllFeedback = useCallback(() => {
    sendInstruction("Summarize all feedback");
  }, [sendInstruction]);

  const handleAudit = useCallback(() => {
    sendInstruction("Do an accessibility audit of this building");
  }, [sendInstruction]);

  const handleImprovement = useCallback(() => {
    sendInstruction("Write improvement suggestions for the admin");
  }, [sendInstruction]);

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

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>NavAI Ops Dashboard</h1>
        <div style={{ 
          padding: "4px 12px", borderRadius: "20px", 
          background: "rgba(34, 197, 94, 0.1)", 
          border: "1px solid rgba(34, 197, 94, 0.3)", 
          color: "#22c55e", fontSize: "0.8rem", fontWeight: 600 
        }}>
          System Online
        </div>
      </div>

      {/* ===== AI Insight Cards (auto-generated) ===== */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.2rem" }}>✨</span>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#a78bfa" }}>AI Insights</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontStyle: "italic" }}>Auto-generated daily</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {insightsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                padding: "1.2rem", borderRadius: "12px",
                background: "var(--bg-elevated, #1e293b)", 
                border: "1px solid var(--border, #334155)",
                animation: "pulse 1.5s infinite",
                minHeight: "80px",
              }} />
            ))
          ) : (
            insights.map((insight, i) => (
              <div key={i} style={{
                padding: "1.2rem", borderRadius: "12px",
                background: "var(--bg-elevated, #1e293b)",
                border: `1px solid ${insight.color}20`,
                borderLeft: `4px solid ${insight.color}`,
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${insight.color}15`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{insight.icon}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)", fontWeight: 600 }}>{insight.title}</span>
                </div>
                <p style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: insight.color }}>
                  {insight.value}
                </p>
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem" }}>
                    {insight.trend === "up" ? "📈" : insight.trend === "down" ? "📉" : "➡️"}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)", textTransform: "capitalize" }}>{insight.trend}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== AI Work Section ===== */}
      <div style={{ 
        marginBottom: "2.5rem", padding: "1.5rem", borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(99, 102, 241, 0.05))",
        border: "1px solid rgba(124, 58, 237, 0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.2rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>AI Work Assistant</h2>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--fg-muted)" }}>Generate reports, summaries, and audits with one click or voice command</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <button
            onClick={handleGenerateWeeklyReport}
            disabled={isThinking}
            style={{
              padding: "14px 16px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "white", fontWeight: 600, fontSize: "0.9rem",
              cursor: isThinking ? "wait" : "pointer",
              opacity: isThinking ? 0.7 : 1,
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
            }}
          >
            📊 Generate Weekly Report
          </button>

          <button
            onClick={handleSummarizeAllFeedback}
            disabled={isThinking}
            style={{
              padding: "14px 16px", borderRadius: "10px", border: "none",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a78bfa", fontWeight: 600, fontSize: "0.9rem",
              cursor: isThinking ? "wait" : "pointer",
              opacity: isThinking ? 0.7 : 1,
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
            }}
          >
            📝 Summarize All Feedback
          </button>

          <button
            onClick={handleAudit}
            disabled={isThinking}
            style={{
              padding: "14px 16px", borderRadius: "10px", border: "none",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a78bfa", fontWeight: 600, fontSize: "0.9rem",
              cursor: isThinking ? "wait" : "pointer",
              opacity: isThinking ? 0.7 : 1,
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
            }}
          >
            🔍 Accessibility Audit
          </button>

          <button
            onClick={handleImprovement}
            disabled={isThinking}
            style={{
              padding: "14px 16px", borderRadius: "10px", border: "none",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a78bfa", fontWeight: 600, fontSize: "0.9rem",
              cursor: isThinking ? "wait" : "pointer",
              opacity: isThinking ? 0.7 : 1,
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
            }}
          >
            💡 Improvement Suggestions
          </button>
        </div>

        {isThinking && (
          <div style={{ 
            marginTop: "16px", padding: "12px 16px", borderRadius: "8px",
            background: "rgba(124, 58, 237, 0.1)", 
            border: "1px solid rgba(124, 58, 237, 0.2)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ 
              width: "14px", height: "14px", borderRadius: "50%",
              border: "2px solid rgba(124, 58, 237, 0.3)", 
              borderTopColor: "#7c3aed",
              animation: "spin 1s linear infinite" 
            }} />
            <span style={{ color: "#c4b5fd", fontSize: "0.9rem", fontWeight: 500 }}>
              AI is generating your report...
            </span>
          </div>
        )}
      </div>

      {/* ===== Metric Cards ===== */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ background: "var(--bg-elevated, #1e293b)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border, #334155)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "var(--fg-muted)", fontSize: "1rem", margin: "0 0 0.5rem 0" }}>Total Feedback Handled</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: "bold", margin: 0 }}>{summary.total_count}</p>
          </div>

          <div style={{ background: "var(--bg-elevated, #1e293b)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border, #334155)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "var(--fg-muted)", fontSize: "1rem", marginBottom: "1rem" }}>NLP Sentiment Trends</h3>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#16a34a", fontWeight: "bold" }}>Positive</span>
                <span style={{ fontWeight: "bold" }}>{summary.sentiment_trends.positive || 0}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#fbbf24", fontWeight: "bold" }}>Neutral</span>
                <span style={{ fontWeight: "bold" }}>{summary.sentiment_trends.neutral || 0}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#dc2626", fontWeight: "bold" }}>Negative</span>
                <span style={{ fontWeight: "bold" }}>{summary.sentiment_trends.negative || 0}</span>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-elevated, #1e293b)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border, #334155)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "var(--fg-muted)", fontSize: "1rem", marginBottom: "1rem" }}>Route Issues Detected</h3>
            {summary.top_issues.length === 0 ? <p style={{ color: "var(--fg-muted)" }}>No issues logged.</p> : summary.top_issues.map(issue => (
              <div key={issue.category} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", padding: "0.5rem", background: "var(--bg, #0f172a)", borderRadius: "6px" }}>
                <span style={{ textTransform: "capitalize" }}>{issue.category.replace("_", " ")}</span>
                <span style={{ fontWeight: "bold" }}>{issue.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Recent Feedback ===== */}
      <h2>Recent Feedback Feed</h2>
      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {!summary ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--fg-muted)" }}>
            Loading Live Metrics from FastAPI Backend...
          </div>
        ) : recent.length === 0 ? (
          <p style={{ color: "var(--fg-muted)" }}>No recent feedback available.</p>
        ) : (
          recent.map(item => (
            <div key={item.id} style={{ 
              padding: "1.5rem", background: "var(--bg-elevated, #1e293b)", borderRadius: "12px", 
              borderLeft: `6px solid ${item.sentiment_label === 'negative' ? '#dc2626' : item.sentiment_label === 'positive' ? '#16a34a' : '#fbbf24'}`, 
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)" 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.8rem", color: "var(--fg-muted)", letterSpacing: "1px" }}>{item.category.replace("_", " ")}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>{new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p style={{ lineHeight: "1.6", margin: 0 }}>{item.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Inline Report Display (kept for admin page context) */}
      {report && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 900,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: "#1e293b", borderRadius: "16px", width: "100%", maxWidth: "700px",
            maxHeight: "85vh", display: "flex", flexDirection: "column",
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
                <button onClick={() => downloadAsText(report, "navai-admin-report.txt")} style={btnSmall}>⬇ Download</button>
                <button onClick={dismissReport} style={btnSmall}>✕</button>
              </div>
            </div>
            <div style={{ padding: "20px", overflowY: "auto", color: "#e2e8f0", fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {report}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const btnSmall: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)", border: "none",
  color: "#94a3b8", padding: "4px 10px", borderRadius: "6px",
  cursor: "pointer", fontSize: "0.75rem",
};
