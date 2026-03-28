"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useSpeak } from "@/hooks/useSpeak";
import { useAccessibilityProfile } from "@/app/AccessibilityProfileContext";

// ---------- Types ----------

export interface AssistantAction {
  type: string;
  field?: string;
  value?: any;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  followUp?: string | null;
  timestamp: number;
}

interface AssistantContextType {
  messages: AssistantMessage[];
  isOpen: boolean;
  isThinking: boolean;
  report: string | null;
  listItems: { title: string; detail: string }[] | null;
  highlightedFields: string[];
  sendInstruction: (instruction: string) => Promise<void>;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  clearSession: () => void;
  dismissReport: () => void;
  dismissList: () => void;
}

const AssistantContext = createContext<AssistantContextType | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be inside AssistantProvider");
  return ctx;
}

// ---------- Provider ----------

export default function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [listItems, setListItems] = useState<{ title: string; detail: string }[] | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  const pathname = usePathname();
  const router = useRouter();
  const { speak } = useSpeak();
  const { profile } = useAccessibilityProfile();
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // Build current context from app state
  const buildContext = useCallback(() => {
    const page = pathname?.replace("/", "") || "home";
    return {
      current_page: page,
      current_building: "Bennett University",
      current_floor: 0,
      current_room: null,
      active_hazards: [],
      user_profile: profile || "wheelchair",
      open_form: page === "feedback" ? "feedback_form" : null,
      form_fields: page === "feedback" ? ["name", "email", "category", "message"] : [],
      selected_building: null,
      navigation_active: page === "navigate",
      last_action: null,
    };
  }, [pathname, profile]);

  // Execute actions returned by the AI
  const executeActions = useCallback((actions: AssistantAction[]) => {
    const fieldsToHighlight: string[] = [];

    for (const action of actions) {
      switch (action.type) {
        case "FILL_FIELD": {
          if (action.field && action.value !== undefined) {
            fieldsToHighlight.push(action.field);
            window.dispatchEvent(
              new CustomEvent("navai-fill-field", {
                detail: { field: action.field, value: action.value },
              })
            );
          }
          break;
        }
        case "SUBMIT_FORM":
          window.dispatchEvent(new CustomEvent("navai-submit-form"));
          break;
        case "APPEND_TO_FIELD":
          if (action.field && action.value) {
            window.dispatchEvent(
              new CustomEvent("navai-append-field", {
                detail: { field: action.field, value: action.value },
              })
            );
          }
          break;
        case "CLEAR_FIELD":
          if (action.field) {
            window.dispatchEvent(
              new CustomEvent("navai-fill-field", {
                detail: { field: action.field, value: "" },
              })
            );
          }
          break;
        case "SHOW_LIST":
          if (Array.isArray(action.value)) {
            setListItems(action.value);
          }
          break;
        case "CREATE_REPORT":
          if (typeof action.value === "string") {
            setReport(action.value);
          }
          break;
        case "SCROLL_TO":
          if (action.value && typeof action.value === "string") {
            const el = document.getElementById(action.value);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }
          break;
        case "HIGHLIGHT_ITEM":
          if (action.value) {
            window.dispatchEvent(
              new CustomEvent("navai-highlight", { detail: { item: action.value } })
            );
          }
          break;
        case "UPDATE_DASHBOARD":
          if (action.value) {
            window.dispatchEvent(
              new CustomEvent("navai-dashboard-update", { detail: { content: action.value } })
            );
          }
          break;
        case "EXECUTE_TOOL": {
          if (action.field && action.value) {
            const toolName = action.field;
            const args = action.value;
            
            if (toolName === "navigate_to_page") {
              const page = args.page;
              let target = "/" + page;
              if (page === "map") target = "/navigate";
              if (page === "indoor_map") target = "/building/bennett";
              router.push(target);
            } else if (toolName === "sign_out") {
              localStorage.removeItem("navai_user_session");
              localStorage.removeItem("navai_setup_complete");
              router.push("/login");
            } else if (toolName === "change_accessibility_profile") {
              if (args.profile && typeof window !== "undefined") {
                 window.dispatchEvent(
                    new CustomEvent("navai-profile-change", { detail: { profile: args.profile } })
                 );
              }
            } else if (toolName === "zoom_map") {
                if (pathname !== "/navigate") {
                    router.push("/navigate");
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("navai-tool", { detail: { tool: "zoom_map", args } }));
                    }, 1000);
                } else {
                    window.dispatchEvent(new CustomEvent("navai-tool", { detail: { tool: "zoom_map", args } }));
                }
            } else if (toolName === "switch_floor") {
                window.dispatchEvent(new CustomEvent("navai-tool", { detail: { tool: "switch_floor", args } }));
            } else if (toolName === "highlight_building" || toolName === "show_building_info") {
                if (pathname !== "/navigate") {
                    router.push("/navigate");
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("navai-tool", { detail: { tool: "highlight_building", args } }));
                    }, 1000);
                } else {
                    window.dispatchEvent(new CustomEvent("navai-tool", { detail: { tool: "highlight_building", args } }));
                }
            } else if (toolName === "report_hazard" || toolName === "broadcast_alert") {
                 window.dispatchEvent(new CustomEvent("navai-hazard-event", { detail: { tool: toolName, args } }));
            } else if (toolName === "speak_text") {
                if (args.text) {
                    speak(args.text, args.priority || "polite");
                }
            } else if (toolName === "fill_form_field") {
                window.dispatchEvent(
                  new CustomEvent("navai-fill-field", {
                    detail: { field: args.field_name, value: args.value },
                  })
                );
            } else if (toolName === "submit_form") {
                window.dispatchEvent(new CustomEvent("navai-submit-form"));
            } else if (toolName === "show_on_screen") {
                if (args.content) {
                    setReport(args.content);
                }
            } else {
              window.dispatchEvent(new CustomEvent("navai-tool", { detail: { tool: toolName, args } }));
            }
          }
          break;
        }
        default:
          break;
      }
    }

    if (fieldsToHighlight.length > 0) {
      setHighlightedFields(fieldsToHighlight);
      setTimeout(() => setHighlightedFields([]), 2500);
    }
  }, [pathname, router, speak]);

  const sendInstruction = useCallback(
    async (instruction: string) => {
      const clearCmds = ["start over", "forget that", "forget everything", "clear session", "reset"];
      if (clearCmds.some(cmd => instruction.toLowerCase().trim() === cmd)) {
        setMessages([]);
        historyRef.current = [];
        setReport(null);
        setListItems(null);
        speak("Session cleared. What would you like to do?", "polite");
        return;
      }

      const userMsg: AssistantMessage = {
        role: "user",
        content: instruction,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      historyRef.current.push({ role: "user", content: instruction });

      setIsThinking(true);
      setIsOpen(true);

      try {
        const res = await api.post("/api/assistant/do", {
          instruction,
          context: buildContext(),
          conversation_history: historyRef.current.slice(-20),
        }, { timeout: 600000, skipLoading: true } as any); // 10 minutes

        const data = res.data;

        const assistantMsg: AssistantMessage = {
          role: "assistant",
          content: data.response_text,
          actions: data.actions,
          followUp: data.follow_up,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        historyRef.current.push({ role: "assistant", content: data.response_text });

        if (data.actions && data.actions.length > 0) {
          const hasClear = data.actions.some((a: any) => a.type === "CLEAR_SESSION");
          if (hasClear) {
            setMessages([]);
            historyRef.current = [];
            setReport(null);
            setListItems(null);
          } else {
            executeActions(data.actions);
          }
        }

        speak(data.response_text, "assertive");
        if (data.follow_up) {
          setTimeout(() => speak(data.follow_up, "polite"), 2000);
        }
      } catch (err: any) {
        console.error("[Assistant] API Error:", err);
        const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
        
        const errMsg: AssistantMessage = {
          role: "assistant",
          content: isTimeout 
            ? "I'm still trying to wake up my engine. Please stay with me, it might take a moment."
            : "Sorry, I'm having trouble connecting to my brain. Please try again in a few seconds.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        speak(errMsg.content, "assertive");
      } finally {
        setIsThinking(false);
      }
    },
    [buildContext, executeActions, speak]
  );

  const clearSession = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setReport(null);
    setListItems(null);
    speak("Session cleared. Starting fresh.", "polite");
  }, [speak]);

  const value: AssistantContextType = {
    messages,
    isOpen,
    isThinking,
    report,
    listItems,
    highlightedFields,
    sendInstruction,
    togglePanel: () => setIsOpen((p) => !p),
    openPanel: () => setIsOpen(true),
    closePanel: () => setIsOpen(false),
    clearSession,
    dismissReport: () => setReport(null),
    dismissList: () => setListItems(null),
  };

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}
