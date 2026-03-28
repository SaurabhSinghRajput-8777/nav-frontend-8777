"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useVoiceCommandContext } from "@/components/voice/VoiceCommandProvider";
import { useNavigation } from "@/contexts/NavigationContext";
import Logo from "./Logo";

interface NavbarProps {
  hasValidAuth?: boolean;
}

export default function Navbar({ hasValidAuth = true }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isActive: isVoiceActive } = useVoiceCommandContext();
  const { isActive: isNavActive, steps, currentStepIndex, nextStep, prevStep, destination } = useNavigation();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Sync with our new showcase auth dummy system
  useEffect(() => {
    const session = localStorage.getItem("navai_user_session");
    if (session) {
      try {
        const { role } = JSON.parse(session);
        setCurrentUser(role.charAt(0).toUpperCase() + role.slice(1));
      } catch (e) {
        setCurrentUser("User");
      }
    }
  }, [pathname]);

  const handleSignout = () => {
    localStorage.removeItem("navai_user_session");
    localStorage.removeItem("navai_setup_complete");
    setCurrentUser(null);
    router.push("/login");
  };

  // Skip rendering navbar purely on login because there is no nav required there
  if (pathname === "/login" || pathname === "/onboarding") {
    return null;
  }

  const links = [
    { label: "Home", href: "/home" },
    { label: "Navigate", href: "/navigate" },
    { label: "Indoor Map", href: "/building" },
    { label: "Feedback", href: "/feedback" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
      position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.95)", 
      backdropFilter: "blur(12px)", color: "white"
    }}>
      {/* Brand & Mic Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/home" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Logo size="md" />
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Nav<span style={{ color: "#3b82f6" }}>AI</span>
          </span>
        </Link>

        {isVoiceActive && (
          <div style={{ 
            display: "flex", alignItems: "center", gap: "0.4rem", 
            background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", 
            padding: "0.25rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", color: "#f87171",
            fontWeight: 700
          }}>
            <div style={{ 
              width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444",
              animation: "pulseA 1.5s infinite" 
            }} />
            Voice
          </div>
        )}
      </div>

      {/* Global Guidance Strip (Center) */}
      {isNavActive && steps.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem",
          background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)",
          padding: "0.4rem 1.25rem", borderRadius: "16px",
          maxWidth: "40vw",
          animation: "slideInNav 0.4s ease-out"
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <button onClick={prevStep} title="Previous step" style={navBtnStyle} disabled={currentStepIndex === 0}>←</button>
            <div style={{ 
              background: "#10b981", color: "white", width: "20px", height: "20px", 
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 900 
            }}>
              {currentStepIndex + 1}
            </div>
            <button onClick={nextStep} title="Next step" style={navBtnStyle} disabled={currentStepIndex === steps.length - 1}>→</button>
          </div>
          <div style={{ 
            color: "white", fontSize: "0.85rem", fontWeight: 600, 
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
          }}>
            {steps[currentStepIndex].instruction}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link 
              key={link.href} 
              href={link.href}
              style={{
                textDecoration: "none",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#3b82f6" : "#cbd5e1",
                transition: "color 0.2s"
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>{currentUser}</span>
            <button onClick={handleSignout} style={{ padding: "0.4rem 1rem", background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}>Sign Out</button>
          </div>
        ) : (
          <button onClick={() => router.push("/login")} style={{ padding: "0.4rem 1rem", background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}>Log In</button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseA {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes slideInNav {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </nav>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)", border: "none", color: "#10b981",
  width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer",
  fontSize: "0.8rem", fontWeight: 900, display: "flex", alignItems: "center", 
  justifyContent: "center", transition: "all 0.2s"
};
