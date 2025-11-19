"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { z } from "zod";

// Base wizard step interface
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  isOptional?: boolean;
  canSkip?: boolean;
  validation?: z.ZodSchema<any>;
  component: React.ComponentType<any>;
}

// Wizard state interface
export interface WizardState {
  currentStepIndex: number;
  steps: WizardStep[];
  data: Record<string, any>;
  errors: Record<string, string[]>;
  isCompleted: boolean;
  hasUnsavedChanges: boolean;
  savedAt?: Date;
  sessionId: string;
}

// Wizard actions
export type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "GOTO_STEP"; stepIndex: number }
  | { type: "UPDATE_DATA"; stepId: string; data: any }
  | { type: "SET_ERRORS"; stepId: string; errors: string[] }
  | { type: "CLEAR_ERRORS"; stepId?: string }
  | { type: "COMPLETE_WIZARD" }
  | { type: "RESET_WIZARD" }
  | { type: "SAVE_PROGRESS" }
  | { type: "LOAD_PROGRESS"; state: Partial<WizardState> };

// Wizard context
export interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  currentStep: WizardStep;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  updateStepData: (stepId: string, data: any) => void;
  validateCurrentStep: () => Promise<boolean>;
  saveProgress: () => Promise<void>;
  loadProgress: (sessionId: string) => Promise<void>;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// Wizard reducer
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      if (state.currentStepIndex < state.steps.length - 1) {
        return {
          ...state,
          currentStepIndex: state.currentStepIndex + 1,
          hasUnsavedChanges: true,
        };
      }
      return state;

    case "PREVIOUS_STEP":
      if (state.currentStepIndex > 0) {
        return {
          ...state,
          currentStepIndex: state.currentStepIndex - 1,
        };
      }
      return state;

    case "GOTO_STEP":
      if (action.stepIndex >= 0 && action.stepIndex < state.steps.length) {
        return {
          ...state,
          currentStepIndex: action.stepIndex,
        };
      }
      return state;

    case "UPDATE_DATA":
      return {
        ...state,
        data: {
          ...state.data,
          [action.stepId]: {
            ...state.data[action.stepId],
            ...action.data,
          },
        },
        hasUnsavedChanges: true,
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.stepId]: action.errors,
        },
      };

    case "CLEAR_ERRORS":
      if (action.stepId) {
        const { [action.stepId]: _, ...rest } = state.errors;
        return {
          ...state,
          errors: rest,
        };
      }
      return {
        ...state,
        errors: {},
      };

    case "COMPLETE_WIZARD":
      return {
        ...state,
        isCompleted: true,
        hasUnsavedChanges: false,
      };

    case "RESET_WIZARD":
      return {
        ...state,
        currentStepIndex: 0,
        data: {},
        errors: {},
        isCompleted: false,
        hasUnsavedChanges: false,
        savedAt: undefined,
      };

    case "SAVE_PROGRESS":
      return {
        ...state,
        hasUnsavedChanges: false,
        savedAt: new Date(),
      };

    case "LOAD_PROGRESS":
      return {
        ...state,
        ...action.state,
        hasUnsavedChanges: false,
      };

    default:
      return state;
  }
}

// Wizard provider props
export interface WizardProviderProps {
  children: ReactNode;
  steps: WizardStep[];
  sessionId?: string;
  onComplete?: (data: Record<string, any>) => Promise<void>;
  onSave?: (data: Record<string, any>, sessionId: string) => Promise<void>;
  onLoad?: (sessionId: string) => Promise<Partial<WizardState> | null>;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

// Wizard provider component
export function WizardProvider({
  children,
  steps,
  sessionId = `wizard-${Date.now()}`,
  onComplete,
  onSave,
  onLoad,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
}: WizardProviderProps) {
  const initialState: WizardState = {
    currentStepIndex: 0,
    steps,
    data: {},
    errors: {},
    isCompleted: false,
    hasUnsavedChanges: false,
    sessionId,
  };

  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const currentStep = state.steps[state.currentStepIndex];
  const canGoNext = state.currentStepIndex < state.steps.length - 1;
  const canGoPrevious = state.currentStepIndex > 0;
  const progress = ((state.currentStepIndex + 1) / state.steps.length) * 100;

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    const step = currentStep;
    if (!step.validation) return true;

    const stepData = state.data[step.id] || {};

    try {
      await step.validation.parseAsync(stepData);
      dispatch({ type: "CLEAR_ERRORS", stepId: step.id });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => err.message);
        dispatch({ type: "SET_ERRORS", stepId: step.id, errors });
      }
      return false;
    }
  };

  // Navigation functions
  const nextStep = async () => {
    if (canGoNext) {
      const isValid = await validateCurrentStep();
      if (isValid || currentStep.canSkip) {
        dispatch({ type: "NEXT_STEP" });
      }
    }
  };

  const previousStep = () => {
    if (canGoPrevious) {
      dispatch({ type: "PREVIOUS_STEP" });
    }
  };

  const goToStep = (stepIndex: number) => {
    dispatch({ type: "GOTO_STEP", stepIndex });
  };

  const updateStepData = (stepId: string, data: any) => {
    dispatch({ type: "UPDATE_DATA", stepId, data });
  };

  // Save and load progress
  const saveProgress = async () => {
    if (onSave && state.hasUnsavedChanges) {
      try {
        await onSave(state.data, state.sessionId);
        dispatch({ type: "SAVE_PROGRESS" });
      } catch (error) {
        console.error("Failed to save wizard progress:", error);
      }
    }
  };

  const loadProgress = async (sessionId: string) => {
    if (onLoad) {
      try {
        const savedState = await onLoad(sessionId);
        if (savedState) {
          dispatch({ type: "LOAD_PROGRESS", state: savedState });
        }
      } catch (error) {
        console.error("Failed to load wizard progress:", error);
      }
    }
  };

  // Auto-save functionality
  React.useEffect(() => {
    if (autoSave && state.hasUnsavedChanges) {
      const timeoutId = setTimeout(saveProgress, autoSaveInterval);
      return () => clearTimeout(timeoutId);
    }
  }, [state.hasUnsavedChanges, autoSave, autoSaveInterval]);

  // Handle wizard completion
  React.useEffect(() => {
    if (state.isCompleted && onComplete) {
      onComplete(state.data);
    }
  }, [state.isCompleted]);

  const contextValue: WizardContextValue = {
    state,
    dispatch,
    currentStep,
    nextStep,
    previousStep,
    goToStep,
    updateStepData,
    validateCurrentStep,
    saveProgress,
    loadProgress,
    canGoNext,
    canGoPrevious,
    progress,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
}

// Hook to use wizard context
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

// Hook for step data
export function useStepData<T = any>(stepId: string): [T, (data: Partial<T>) => void] {
  const { state, updateStepData } = useWizard();
  const stepData = (state.data[stepId] || {}) as T;

  const setStepData = (data: Partial<T>) => {
    updateStepData(stepId, data);
  };

  return [stepData, setStepData];
}