"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import MapView from "@/components/map/MapView";

export default function HomePage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSetup = localStorage.getItem("navai_setup_complete");
      if (!isSetup) {
        router.push("/onboarding");
      }
    }
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      router.push(`/map?to=${encodeURIComponent(destination.trim())}`);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Suspense fallback={<div style={{ width: "100%", height: "100vh", background: "#0f172a" }} />}>
        <MapView />
      </Suspense>
      
      {/* Top overlay: Logo + Search */}
      <div style={{ position: "absolute", top: "1rem", left: "1rem", right: "1rem", zIndex: 10 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, textShadow: "0 2px 4px rgba(0,0,0,0.5)", marginBottom: "0.75rem", color: "white" }}>🧭 NavAI</h1>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            id="destination-search"
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="Where do you want to go?"
            aria-label="Search destination"
            style={{ 
              flex: 1, padding: "0.75rem 1rem", borderRadius: "12px", border: "none", 
              background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "1rem", outline: "none"
            }}
          />
          <button type="submit" style={{
            padding: "0.75rem 1.25rem", borderRadius: "12px", background: "#3b82f6", color: "white",
            border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>Go</button>
        </form>
      </div>

      {/* Bottom quick actions */}
      <div style={{ 
        position: "absolute", bottom: "100px", left: "1rem", right: "5rem", zIndex: 10,
        display: "flex", gap: "0.5rem", flexWrap: "wrap"
      }}>
        {[
          { label: "📝 Feedback", href: "/feedback" },
          { label: "📊 Admin", href: "/admin" },
          { label: "⚙️ Settings", href: "/settings" },
        ].map(link => (
          <button key={link.href} onClick={() => router.push(link.href)} style={{
            padding: "0.5rem 1rem", borderRadius: "20px", background: "rgba(255,255,255,0.9)",
            border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>{link.label}</button>
        ))}
      </div>
    </div>
  );
}
