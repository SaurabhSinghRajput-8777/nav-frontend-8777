"use client";

import { useEffect } from "react";

export default function NavigateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Navigate page error:", error);
  }, [error]);

  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h2>Navigation Error</h2>
      <p style={{ color: "var(--fg-muted)", margin: "1rem 0" }}>{error.message}</p>
      <button onClick={reset} style={{ padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Try again</button>
    </div>
  );
}
