"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface AccessibilityContextType {
  profile: string;
  setProfile: (profile: string) => void;
  triggerVibration: (pattern?: number | number[]) => void;
  isWheelchair: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  profile: "Multiple / Other",
  setProfile: () => {},
  triggerVibration: () => {},
  isWheelchair: false,
});

export const useAccessibilityProfile = () => useContext(AccessibilityContext);

export default function AccessibilityProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState("Multiple / Other");
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("navai_disability_profile");
      if (saved) {
        setProfileState(saved);
      }

      const handleProfileChange = (e: any) => {
        let newProfile = e.detail?.profile;
        if (newProfile === "blind") newProfile = "Blind / Low Vision";
        if (newProfile === "wheelchair") newProfile = "Wheelchair / Mobility";
        if (newProfile === "deaf") newProfile = "Deaf / Hard of Hearing";
        if (newProfile === "standard") newProfile = "Standard / Developer";
        setProfileState(newProfile);
        localStorage.setItem("navai_disability_profile", newProfile);
      };

      window.addEventListener("navai-profile-change", handleProfileChange);
      return () => window.removeEventListener("navai-profile-change", handleProfileChange);
    }
  }, []);

  const setProfile = (newProfile: string) => {
    setProfileState(newProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem("navai_disability_profile", newProfile);
    }
  };

  // Blind mode: auto-announce every screen change
  useEffect(() => {
    if (profile === "Blind / Low Vision" && typeof window !== "undefined" && "speechSynthesis" in window) {
      const pageName = pathname === "/" ? "Home" : pathname.replace("/", "");
      const utterance = new SpeechSynthesisUtterance(`Navigated to ${pageName} screen.`);
      window.speechSynthesis.speak(utterance);
    }
  }, [pathname, profile]);

  // Deaf mode: vibrate function
  const triggerVibration = (pattern: number | number[] = [200, 100, 200]) => {
    if (profile === "Deaf / Hard of Hearing" && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const isWheelchair = profile === "Wheelchair / Mobility" || profile === "Multiple / Other";

  return (
    <AccessibilityContext.Provider value={{ profile, setProfile, triggerVibration, isWheelchair }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
