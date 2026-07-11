"use client";

import { useCallback, useState } from "react";
import {
  INITIAL_DISCOVERY_DATA,
  TOTAL_STEPS,
  type ProjectDiscoveryData,
} from "@/types/project";

const AUTO_ADVANCE_MS = 320;

export type WizardPhase = "steps" | "email-success" | "whatsapp-success";

export function useProjectDiscovery(onClose: () => void) {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<WizardPhase>("steps");
  const [data, setData] = useState<ProjectDiscoveryData>(INITIAL_DISCOVERY_DATA);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const reset = useCallback(() => {
    setStep(1);
    setPhase("steps");
    setData(INITIAL_DISCOVERY_DATA);
    setIsTransitioning(false);
    setDirection("forward");
  }, []);

  const close = useCallback(() => {
    onClose();
    setTimeout(reset, 300);
  }, [onClose, reset]);

  const next = useCallback(() => {
    setDirection("forward");
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }, []);

  const prev = useCallback(() => {
    if (phase !== "steps") {
      setPhase("steps");
      setStep(8);
      return;
    }
    setDirection("backward");
    setStep((current) => Math.max(current - 1, 1));
  }, [phase]);

  const goTo = useCallback((target: number) => {
    setDirection("backward");
    setPhase("steps");
    setStep(target);
  }, []);

  const updateField = useCallback(
    <K extends keyof ProjectDiscoveryData>(
      key: K,
      value: ProjectDiscoveryData[K],
    ) => {
      setData((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const selectAndAdvance = useCallback(
    <K extends keyof ProjectDiscoveryData>(
      key: K,
      value: ProjectDiscoveryData[K],
    ) => {
      setData((current) => ({ ...current, [key]: value }));
      setIsTransitioning(true);
      setDirection("forward");
      setTimeout(() => {
        setIsTransitioning(false);
        setStep((current) => Math.min(current + 1, TOTAL_STEPS));
      }, AUTO_ADVANCE_MS);
    },
    [],
  );

  const selectContactMethod = useCallback(
    (method: "email" | "whatsapp") => {
      setData((current) => ({ ...current, contactMethod: method }));
      setDirection("forward");
      setPhase(method === "email" ? "email-success" : "whatsapp-success");
    },
    [],
  );

  const canContinue = useCallback((): boolean => {
    switch (step) {
      case 1:
        return data.projectType !== null;
      case 2:
        return data.budget !== null;
      case 3:
        return data.timeline !== null;
      case 4:
        return data.referral !== null;
      case 5:
        return (
          data.name.trim().length > 0 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        );
      case 6:
        return data.description.trim().length >= 10;
      case 7:
      case 8:
        return true;
      default:
        return false;
    }
  }, [step, data]);

  const continueStep = useCallback(() => {
    if (!canContinue() || isTransitioning) return;
    next();
  }, [canContinue, isTransitioning, next]);

  return {
    step,
    phase,
    data,
    isTransitioning,
    direction,
    totalSteps: TOTAL_STEPS,
    next,
    prev,
    goTo,
    close,
    updateField,
    selectAndAdvance,
    selectContactMethod,
    canContinue,
    continueStep,
    reset,
  };
}

export type UseProjectDiscoveryReturn = ReturnType<typeof useProjectDiscovery>;
