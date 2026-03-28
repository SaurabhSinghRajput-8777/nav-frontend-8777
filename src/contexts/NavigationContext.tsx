"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Building } from "@/lib/types";

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface NavigationContextType {
  destination: string;
  targetBuilding: Building | null;
  steps: RouteStep[];
  currentStepIndex: number;
  isActive: boolean;
  setNavigation: (dest: string, steps: RouteStep[], building?: Building) => void;
  clearNavigation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (index: number) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [destination, setDestination] = useState("");
  const [targetBuilding, setTargetBuilding] = useState<Building | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const setNavigation = useCallback((dest: string, fetchedSteps: RouteStep[], building?: Building) => {
    setDestination(dest);
    setTargetBuilding(building || null);
    setSteps(fetchedSteps);
    setCurrentStepIndex(0);
    setIsActive(fetchedSteps.length > 0);
  }, []);

  const clearNavigation = useCallback(() => {
    setDestination("");
    setTargetBuilding(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setIsActive(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const setCurrentStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [steps.length]);

  return (
    <NavigationContext.Provider
      value={{
        destination,
        targetBuilding,
        steps,
        currentStepIndex,
        isActive,
        setNavigation,
        clearNavigation,
        nextStep,
        prevStep,
        setCurrentStep,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
