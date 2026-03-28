"use client";

import { useCallback } from "react";

export function useSpeak() {
  const speak = useCallback(
    (text: string, priority: "assertive" | "polite" = "assertive") => {
      if (!("speechSynthesis" in window)) {
        console.warn("SpeechSynthesis not supported");
        return;
      }
      if (priority === "assertive") {
        speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      
      const speakId = Date.now();
      if (typeof window !== "undefined") {
        (window as any).navai_speak_id = speakId;
        (window as any).navai_is_speaking = true;
        window.dispatchEvent(new Event("navai-tts-start"));
      }
      
      utterance.onend = () => {
         if (typeof window !== "undefined" && (window as any).navai_speak_id === speakId) {
             (window as any).navai_is_speaking = false;
         }
      };
      
      utterance.onerror = () => {
         if (typeof window !== "undefined" && (window as any).navai_speak_id === speakId) {
             (window as any).navai_is_speaking = false;
         }
      };
      
      speechSynthesis.speak(utterance);
    },
    []
  );

  const stop = useCallback(() => {
    speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
