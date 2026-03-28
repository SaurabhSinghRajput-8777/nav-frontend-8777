"use client";

import dynamic from "next/dynamic";

// Dynamically import the leaflet map to disable Server-Side Rendering (SSR).
// Leaflet uses the `window` object which is undefined on the server, causing crashes.
const LeafletMap = dynamic(
  () => import("./LeafletMap"),
  { 
    ssr: false, 
    loading: () => (
      <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white" }}>
        Loading Map...
      </div>
    ) 
  }
);

export default function MapView() {
  return <LeafletMap />;
}
