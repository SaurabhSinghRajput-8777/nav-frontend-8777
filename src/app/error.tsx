"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error);
  }, [error]);

  return (
    <div style={{ padding: "3rem", textAlign: "center", background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <h2>Oops, something went wrong!</h2>
      <p style={{ color: "var(--fg-muted)", marginBottom: "2rem", maxWidth: "400px" }}>
        {error.message || "An unexpected error occurred in this section."}
      </p>
      <button
        onClick={() => reset()}
        style={{ padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}
      >
        Try again
      </button>
    </div>
  );
}
