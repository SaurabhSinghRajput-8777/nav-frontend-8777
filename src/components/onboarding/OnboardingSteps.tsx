"use client";

import { useState } from "react";

const STEPS = [
  { title: "Welcome to NavAI", description: "AI-powered accessible navigation for everyone.", emoji: "🧭" },
  { title: "How do you navigate?", description: "Select your accessibility needs so we can customize your experience.", emoji: "♿" },
  { title: "Voice Commands", description: "Control the app entirely with your voice. Say 'navigate to [place]' to get started.", emoji: "🎤" },
  { title: "Visual Alerts", description: "Get large, color-coded turn cards and vibration patterns for each direction.", emoji: "📱" },
  { title: "Report Obstacles", description: "Help the community by reporting blocked paths, construction, or inaccessible routes.", emoji: "🚧" },
  { title: "Indoor Navigation", description: "Navigate inside buildings with floor-by-floor directions.", emoji: "🏢" },
  { title: "You're Ready!", description: "Start exploring with NavAI. Say 'help' anytime for voice command list.", emoji: "🚀" },
];

interface OnboardingStepsProps {
  onComplete: () => void;
}

export default function OnboardingSteps({ onComplete }: OnboardingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function next() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__progress" aria-label={`Step ${currentStep + 1} of ${STEPS.length}`}>
        <div style={{ width: `${progress}%` }} />
      </div>

      <div style={{ fontSize: "4rem" }} aria-hidden="true">{step.emoji}</div>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem" }}>{step.title}</h2>
      <p style={{ color: "var(--fg-muted)", marginTop: "0.5rem", maxWidth: "400px", textAlign: "center" }}>
        {step.description}
      </p>

      <div className="onboarding__nav">
        {currentStep > 0 && (
          <button className="btn btn-outline" onClick={() => setCurrentStep((s) => s - 1)}>
            Back
          </button>
        )}
        <button className="btn btn-primary" onClick={next}>
          {currentStep < STEPS.length - 1 ? "Next" : "Get Started"}
        </button>
      </div>

      <button
        onClick={onComplete}
        style={{ marginTop: "2rem", background: "none", border: "none", color: "var(--fg-muted)", cursor: "pointer", textDecoration: "underline" }}
      >
        Skip tutorial
      </button>
    </div>
  );
}
