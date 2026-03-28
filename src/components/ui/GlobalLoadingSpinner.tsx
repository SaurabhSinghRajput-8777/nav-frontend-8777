"use client";

import { useState, useEffect } from "react";

export default function GlobalLoadingSpinner() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleStart = () => {
      setActiveRequests(prev => prev + 1);
      
      // Safety: If spinner stays for 20s, force clear it
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (activeRequests > 0) {
          console.warn("[GlobalLoadingSpinner] Safety timeout: Force clearing loading state.");
          setActiveRequests(0);
        }
      }, 20000);
    };

    const handleEnd = () => {
      setActiveRequests(prev => Math.max(0, prev - 1));
      if (timeout) clearTimeout(timeout);
    };

    window.addEventListener("api-request-start", handleStart);
    window.addEventListener("api-request-end", handleEnd);

    return () => {
      window.removeEventListener("api-request-start", handleStart);
      window.removeEventListener("api-request-end", handleEnd);
      if (timeout) clearTimeout(timeout);
    };
  }, [activeRequests]);

  if (activeRequests === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999
    }}>
      <div style={{
        width: "60px", height: "60px", border: "6px solid var(--bg-elevated)", borderTop: "6px solid var(--primary)",
        borderRadius: "50%", animation: "spin 1s linear infinite"
      }}>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
