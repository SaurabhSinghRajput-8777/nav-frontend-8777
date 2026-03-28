"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import api from "@/lib/api";

// ----- Web Speech API Types -----
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

export interface NLPAction {
  type: string;
  payload: Record<string, any>;
}

export interface NLPResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  action: NLPAction;
  spoken_response: string;
  requires_confirmation: boolean;
}

interface UseAlwaysOnVoiceOptions {
  lang?: string;
  onResult?: (result: NLPResult) => void;
  onInterimTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onAssistantTrigger?: (text: string) => void;
}

// --- AI Assistant Trigger Detection ---
const AI_TRIGGER_PREFIXES = [
  "write", "generate", "create", "make",
  "list", "show me all", "what are all",
  "summarize", "analyze", "give me a report",
  "fill in", "fill the", "fill my", "complete the", "help me write",
  "describe", "explain", "how can",
  "do an audit", "what needs fixing", "what needs repair",
  "report the", "report a",
  "i want to say", "i would like to say",
  "also add", "also mention", "and also",
  "open assistant", "hey assistant", "hey ai",
  "start over", "forget that", "forget everything",
  "change", "select", "set", "switch",
];

const AI_TRIGGER_KEYWORDS = [
  "obstacle report", "accessibility audit", "weekly report",
  "improvement suggestion", "hazard report", "hazard summary",
  "feedback summary", "all issues", "all problems",
  "common problems", "common issues",
  "better route", "better accessible",
  "broken ramp", "lift not working", "elevator not working",
  "needs fixing",
];

function isAITrigger(text: string): boolean {
  const t = text.toLowerCase().trim();
  // Check prefix triggers
  for (const prefix of AI_TRIGGER_PREFIXES) {
    if (t.startsWith(prefix)) return true;
  }
  // Check keyword triggers
  for (const kw of AI_TRIGGER_KEYWORDS) {
    if (t.includes(kw)) return true;
  }
  // Multi-turn: simple yes/no/submit responses when assistant may be waiting
  return false;
}

export function useAlwaysOnVoice(options: UseAlwaysOnVoiceOptions = {}) {
  const { lang = "en-US" } = options;
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastFinalTranscript, setLastFinalTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isAssistantWorking, setIsAssistantWorking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isActiveRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backendAliveRef = useRef(false);
  
  const onResultRef = useRef(options.onResult);
  const onInterimRef = useRef(options.onInterimTranscript);
  const onFinalRef = useRef(options.onFinalTranscript);
  const onAssistantTriggerRef = useRef(options.onAssistantTrigger);
  const interimDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track if assistant was last responder (for yes/no follow-up routing)
  const assistantWasLastRef = useRef(false);

  // Periodic backend health check
  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        await api.get("/health", { timeout: 10000, skipLoading: true } as any); // 10s health check
        backendAliveRef.current = true;
        console.log("[NavAI Voice] Backend connection established ✓");
      } catch {
        backendAliveRef.current = false;
        if (!cancelled) setTimeout(checkHealth, 5000);
      }
    };
    checkHealth();
    return () => { cancelled = true; };
  }, []);

  // Keep refs in sync
  useEffect(() => {
    onResultRef.current = options.onResult;
    onInterimRef.current = options.onInterimTranscript;
    onFinalRef.current = options.onFinalTranscript;
    onAssistantTriggerRef.current = options.onAssistantTrigger;
  }, [options.onResult, options.onInterimTranscript, options.onFinalTranscript, options.onAssistantTrigger]);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsReconnecting(false);
      console.log("SpeechRecognition started");
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        console.warn("Autostart blocked by browser, needs gesture.");
        setNeedsGesture(true);
      }
    }
  }, []);

  // Initialize SpeechRecognition once
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn("SpeechRecognition not supported");
      setIsUnsupported(true);
      return;
    }

    const recognition = new SR() as SpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Drop any rogue acoustic packets using the custom TTS state lock
      if (typeof window !== "undefined" && (window as any).navai_is_speaking) {
        return;
      }

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setIsSpeaking(true);
        const cleanInterim = interim.trim();
        setInterimTranscript(cleanInterim);
        onInterimRef.current?.(cleanInterim);

        if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
        interimDebounceRef.current = setTimeout(() => {
          if (backendAliveRef.current && !isAITrigger(cleanInterim)) {
            api.post("/api/voice/understand", { text: cleanInterim }, { timeout: 600000, skipLoading: true } as any)
              .catch(() => { /* do not permanently kill the backend alive status on transient errors */ });
          }
        }, 800);
      }

      if (final) {
        if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
        setIsSpeaking(false);
        const text = final.trim();
        if (text) {
          setInterimTranscript("");
          setLastFinalTranscript(text);
          onFinalRef.current?.(text);

          const shouldRouteToAssistant = isAITrigger(text);
          const isSimpleConfirmation = /^(yes|no|submit|go ahead|confirm|cancel|do it|send it|yes please|yes submit)$/i.test(text.trim());
          
          if (shouldRouteToAssistant || (isSimpleConfirmation && assistantWasLastRef.current)) {
            assistantWasLastRef.current = true;
            setIsAssistantWorking(true);
            onAssistantTriggerRef.current?.(text);
            setTimeout(() => setIsAssistantWorking(false), 15000); 
          } else {
            assistantWasLastRef.current = false;
            const localResult = localMatch(text);
            if (localResult) {
              onResultRef.current?.(localResult);
            } else {
              processWithNLP(text);
            }
          }
        }
      }
    };

    const localMatch = (text: string): NLPResult | null => {
      const t = text.toLowerCase();
      const match = (phrases: string[]) => phrases.some(p => t.includes(p));

      // Killswitch
      if (match(["stop listening", "turn off voice"])) {
        deactivate();
        return { intent: "SETTINGS_CHANGE", confidence: 1.0, entities: {}, action: { type: "UNKNOWN", payload: {} }, spoken_response: "Deactivated.", requires_confirmation: false };
      }

      if (match(["go home", "home page"])) return buildLocal("PAGE_NAVIGATION", "GO_TO_PAGE", { page: "/home" }, "Navigating home.");
      if (match(["open map", "go to map"])) return buildLocal("PAGE_NAVIGATION", "GO_TO_PAGE", { page: "/navigate" }, "Opening the map.");
      if (match(["open indoor map", "indoor map"])) return buildLocal("PAGE_NAVIGATION", "GO_TO_PAGE", { page: "/building" }, "Opening the indoor map.");
      if (match(["go to feedback", "open feedback"])) return buildLocal("PAGE_NAVIGATION", "GO_TO_PAGE", { page: "/feedback" }, "Opening feedback form.");
      if (match(["go to settings"])) return buildLocal("PAGE_NAVIGATION", "GO_TO_PAGE", { page: "/settings" }, "Opening settings.");
      if (match(["go to admin", "open admin", "open dashboard"])) return buildLocal("PAGE_NAVIGATION", "GO_TO_PAGE", { page: "/admin" }, "Opening admin dashboard.");
      if (match(["go back"])) return buildLocal("PAGE_NAVIGATION", "GO_BACK", {}, "Going back.");
      if (match(["repeat", "say that again"])) return buildLocal("REPEAT_INSTRUCTION", "REPEAT_LAST", {}, "");
      if (match(["log out", "sign out"])) return buildLocal("AUTH", "SIGN_OUT", {}, "Logging out.");
      if (match(["start demo"])) return buildLocal("DEMO_MODE", "START_DEMO", {}, "Starting demo mode.");

      const fMatch = t.match(/floor\s*(\d+)/) || t.match(/(ground|first|second|third|top)\s*floor/);
      if (fMatch) {
         let f: any = fMatch[1];
         if (f === "ground") f = 0;
         else if (f === "first") f = 1;
         else if (f === "second") f = 2;
         else if (f === "third") f = 3;
         return buildLocal("FLOOR_CHANGE", "CHANGE_FLOOR", { floor: f }, `Changing to floor ${f}`);
      }
      return null;
    };

    const buildLocal = (intent: string, type: string, payload: any, response: string): NLPResult => ({
      intent, confidence: 0.99, entities: payload, action: { type, payload }, spoken_response: response, requires_confirmation: false
    });

    recognition.onaudiostart = () => {
      setIsSpeaking(true);
      setIsReconnecting(false);
    };
    recognition.onaudioend = () => setIsSpeaking(false);

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setNeedsGesture(true);
        isActiveRef.current = false;
        setIsActive(false);
      }
      setIsSpeaking(false);
    };

    recognition.onend = () => {
      setIsSpeaking(false);
      if (isActiveRef.current) {
        setIsReconnecting(true);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        
        const tryRestart = () => {
          if (typeof window !== "undefined" && (window as any).navai_is_speaking) {
            // Delay restart while TTS is actively speaking without flickering
            reconnectTimeoutRef.current = setTimeout(tryRestart, 500);
            return;
          }
          if (isActiveRef.current) startRecognition();
        };

        reconnectTimeoutRef.current = setTimeout(tryRestart, 500);
      }
    };

    recognitionRef.current = recognition;

    // Listen for TTS start globally to hard-stop microphone buffering
    const handleTtsStart = () => {
      try {
        if (recognitionRef.current) recognitionRef.current.abort();
      } catch (e) {}
    };
    window.addEventListener("navai-tts-start", handleTtsStart);

    const wasActivated = sessionStorage.getItem("navai_voice_activated");
    if (wasActivated === "true" || wasActivated === null) {
      isActiveRef.current = true;
      setIsActive(true);
      startRecognition();
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
      window.removeEventListener("navai-tts-start", handleTtsStart);
      recognition.abort();
    };
  }, [lang, startRecognition]);

  async function processWithNLP(text: string, retryCount = 0) {
    setIsProcessing(true);

    const MAX_RETRIES = 3;

    try {
      const res = await api.post("/api/voice/understand", { text }, { timeout: 600000 });
      backendAliveRef.current = true;
      const nlpResult: NLPResult = res.data;
      onResultRef.current?.(nlpResult);
    } catch (err: any) {
      const isNetworkError = !err.response;
      
      if (isNetworkError && retryCount < MAX_RETRIES) {
        console.warn(`[NavAI Voice] Backend unreachable, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1))); // Linear backoff
        return processWithNLP(text, retryCount + 1);
      }
      
      console.warn("[NavAI Voice] Backend offline. Falling back to local-only mode.");
      onResultRef.current?.({
        intent: "UNKNOWN",
        confidence: 0,
        entities: {},
        action: { type: "UNKNOWN", payload: {} },
        spoken_response: isNetworkError
          ? "I'm having a bit of trouble connecting to my brain. Please try that again in a few seconds."
          : "Sorry, I couldn't quite process that. Please try again or use simpler commands.",
        requires_confirmation: false
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const activate = useCallback(() => {
    isActiveRef.current = true;
    setIsActive(true);
    setNeedsGesture(false);
    sessionStorage.setItem("navai_voice_activated", "true");
    startRecognition();
  }, [startRecognition]);

  const deactivate = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setIsSpeaking(false);
    sessionStorage.setItem("navai_voice_activated", "false");
    try {
      recognitionRef.current?.stop();
    } catch { /* ignored */ }
  }, []);

  const dismissGestureReq = useCallback(() => {
    setNeedsGesture(false);
    sessionStorage.setItem("navai_voice_activated", "false");
  }, []);

  // Method to clear assistant-last-responder flag
  const clearAssistantFlag = useCallback(() => {
    assistantWasLastRef.current = false;
  }, []);

  // Method to set assistant flag externally
  const markAssistantAsResponder = useCallback(() => {
    assistantWasLastRef.current = true;
  }, []);

  return {
    isActive,
    isSpeaking,
    isProcessing,
    isReconnecting,
    isAssistantWorking,
    interimTranscript,
    lastFinalTranscript,
    needsGesture,
    isUnsupported,
    activate,
    deactivate,
    dismissGestureReq,
    clearAssistantFlag,
    markAssistantAsResponder,
  };
}
