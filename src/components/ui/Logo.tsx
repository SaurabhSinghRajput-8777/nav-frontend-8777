"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = "md", className, style }: LogoProps) {
  const dimensions = {
    sm: { circle: "24px", font: "0.8rem" },
    md: { circle: "36px", font: "1.1rem" },
    lg: { circle: "48px", font: "1.5rem" },
  }[size];

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: dimensions.circle,
        height: dimensions.circle,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
        color: "white",
        fontWeight: 900,
        fontSize: dimensions.font,
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        flexShrink: 0,
        ...style,
      }}
    >
      N
    </div>
  );
}
