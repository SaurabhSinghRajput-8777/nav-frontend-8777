"use client";

import { AlertTriangle, X } from "lucide-react";

interface ObstacleAlertProps {
  message: string;
  onDismiss: () => void;
}

export default function ObstacleAlert({ message, onDismiss }: ObstacleAlertProps) {
  return (
    <div
      role="alertdialog"
      aria-label="Obstacle alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          maxWidth: "400px",
          width: "100%",
          borderTop: "4px solid var(--danger)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
          <AlertTriangle size={32} color="var(--danger)" />
          <h2 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Obstacle Ahead</h2>
        </div>
        <p style={{ color: "var(--fg-muted)" }}>{message}</p>
        <button
          className="btn btn-danger"
          onClick={onDismiss}
          style={{ width: "100%", marginTop: "1.5rem" }}
        >
          <X size={20} /> Dismiss
        </button>
      </div>
    </div>
  );
}
