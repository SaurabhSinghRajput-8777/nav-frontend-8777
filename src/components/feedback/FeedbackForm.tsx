"use client";

import { useState } from "react";
import { FeedbackCategory, FeedbackSubmission } from "@/lib/types";
import api from "@/lib/api";
import VoiceFeedback from "./VoiceFeedback";

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: "route_issue", label: "Route Issue", emoji: "🛣️" },
  { value: "obstacle", label: "Obstacle", emoji: "🚧" },
  { value: "accessibility_rating", label: "Accessibility", emoji: "♿" },
  { value: "general", label: "General", emoji: "💬" },
];

export default function FeedbackForm() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 5) return;

    setSubmitting(true);
    try {
      const payload: FeedbackSubmission = { text, category };
      await api.post("/feedback/", payload);
      setSuccess(true);
      setText("");
    } catch (err) {
      console.error("Feedback submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ fontSize: "2rem" }}>✅</p>
        <p>Thank you for your feedback!</p>
        <button className="btn btn-primary" onClick={() => setSuccess(false)}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Feedback form">
      <fieldset>
        <legend style={{ fontWeight: 600, marginBottom: "1rem" }}>
          Category
        </legend>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`btn ${category === cat.value ? "btn-primary" : "btn-outline"}`}
              onClick={() => setCategory(cat.value)}
              aria-pressed={category === cat.value}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ marginTop: "1rem" }}>
        <label htmlFor="feedback-text" style={{ fontWeight: 600 }}>
          Your Feedback
        </label>
        <textarea
          id="feedback-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the issue or share your experience..."
          rows={4}
          style={{
            width: "100%",
            marginTop: "0.5rem",
            padding: "12px",
            borderRadius: "var(--radius)",
            border: "2px solid var(--border)",
            background: "var(--bg)",
            color: "var(--fg)",
            fontSize: "1rem",
            resize: "vertical",
          }}
          required
          minLength={5}
        />
        <VoiceFeedback 
          onTranscriptComplete={(transcript: string) => setText(prev => prev ? `${prev} ${transcript}` : transcript)} 
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={submitting || text.trim().length < 5}
        style={{ width: "100%", marginTop: "1rem" }}
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
