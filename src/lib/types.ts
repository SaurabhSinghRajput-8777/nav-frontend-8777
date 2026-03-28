/* ===== NavAI Type Definitions ===== */

// --- User & Profile ---
export type DisabilityProfile = "blind" | "deaf" | "mobility" | "multiple";

export interface UserProfile {
  id: string;
  disabilities: DisabilityProfile[];
  voiceSpeed: "slow" | "normal" | "fast";
  highContrast: boolean;
  language: string;
  onboardingComplete: boolean;
}

// --- Navigation ---
export type NavState =
  | "idle"
  | "searching"
  | "previewing"
  | "navigating"
  | "paused"
  | "arrived";

export type TurnType =
  | "left"
  | "right"
  | "straight"
  | "uturn"
  | "arrive"
  | "elevator"
  | "stairs";

export interface RouteStep {
  instruction: string;
  distance: string;
  distanceMeters: number;
  streetName: string;
  type: TurnType;
  isIndoor: boolean;
  floor?: number;
}

export interface Route {
  steps: RouteStep[];
  totalDistance: string;
  estimatedTime: string;
  isWheelchairAccessible: boolean;
}

// --- Voice ---
export interface VoiceCommand {
  triggers: string[];
  action: (args: string) => void;
  context: ("global" | "navigation" | "feedback" | "onboarding" | "settings" | "paused")[];
  description: string;
}

export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// --- Feedback ---
export type FeedbackCategory =
  | "route_issue"
  | "obstacle"
  | "accessibility_rating"
  | "general";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface FeedbackSubmission {
  text: string;
  category: FeedbackCategory;
  latitude?: number;
  longitude?: number;
}

export interface FeedbackResponse {
  id: number;
  text: string;
  category: FeedbackCategory;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  createdAt: string;
}

// --- Indoor Maps ---
export interface IndoorNode {
  floor: number;
  lat: number;
  lng: number;
  name: string;
}

export interface IndoorEdge {
  from: string;
  to: string;
  distance: number;
  accessible: boolean;
  type?: "walk" | "elevator" | "stairs";
}

export interface IndoorGraph {
  nodes: Record<string, IndoorNode>;
  edges: IndoorEdge[];
}

// --- Vibration ---
export type VibrationPattern =
  | "left"
  | "right"
  | "straight"
  | "stop"
  | "rerouting"
  | "arrive";

// --- Geographical Entities ---
export interface Building {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  category?: "academic" | "hostel" | "admin" | "other";
  accessibilityNotes?: string;
}

export const VIBRATION_PATTERNS: Record<VibrationPattern, number[]> = {
  left: [100, 50, 100],           // short-short
  right: [300, 50, 100],          // long-short
  straight: [100],
  stop: [500],                    // continuous
  rerouting: [200, 100, 200, 100], // alternating
  arrive: [100, 50, 100, 50, 300], // celebration
} as const;
