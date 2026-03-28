"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

interface VoiceFeedbackProps {
  onTranscriptComplete: (text: string) => void;
}

export default function VoiceFeedback({ onTranscriptComplete }: VoiceFeedbackProps) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported for dictation.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after they pause
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onTranscriptComplete(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Dictation error:", event.error);
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscriptComplete]);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsDictating(true);
      } catch (e) {
        console.warn("Could not start dictation:", e);
      }
    }
  };

  if (!recognitionRef.current && typeof window !== "undefined") {
     // If not supported, we just don't render the mic button
     return null;
  }

  return (
    <button
      type="button"
      onClick={toggleDictation}
      className={`btn ${isDictating ? "btn-danger" : "btn-outline"}`}
      style={{ padding: "8px 16px", minHeight: "auto", marginTop: "8px", display: "inline-flex", gap: "8px", alignItems: "center" }}
      aria-pressed={isDictating}
      aria-label={isDictating ? "Stop recording feedback" : "Record feedback with voice"}
    >
      {isDictating ? <Square size={18} /> : <Mic size={18} />}
      {isDictating ? "Stop Recording" : "Dictate"}
    </button>
  );
}
