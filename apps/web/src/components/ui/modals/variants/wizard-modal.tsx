'use client';

import React, { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalConfig } from '../modal-context';

interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component?: React.ComponentType<any>;
  content?: React.ReactNode;
  isValid?: boolean;
  isOptional?: boolean;
}

interface WizardModalProps {
  modal: ModalConfig;
  onClose: () => void;
}

export const WizardModal = memo(function WizardModal({
  modal,
  onClose
}: WizardModalProps) {
  const { title, props = {} } = modal;
  const {
    steps = [] as WizardStep[],
    currentStep = 0,
    onNext,
    onPrevious,
    onComplete,
    onStepChange,
    allowStepNavigation = false,
    showProgress = true,
    showStepNumbers = true,
    nextText = 'Next',
    previousText = 'Previous',
    completeText = 'Complete',
  } = props;

  const [activeStep, setActiveStep] = React.useState(currentStep);
  const [stepData, setStepData] = React.useState<Record<string, any>>({});

  const currentStepData = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const progress = useMemo(() => {
    return ((activeStep + 1) / steps.length) * 100;
  }, [activeStep, steps.length]);

  const isStepValid = useMemo(() => {
    if (!currentStepData) return false;
    if (currentStepData.isOptional) return true;
    return currentStepData.isValid !== false;
  }, [currentStepData]);

  const handleNext = async () => {
    if (!isStepValid) return;

    try {
      if (onNext) {
        await onNext(activeStep, stepData[currentStepData?.id]);
      }

      if (isLastStep) {
        if (onComplete) {
          await onComplete(stepData);
        }
        onClose();
      } else {
        const newStep = activeStep + 1;
        setActiveStep(newStep);
        if (onStepChange) {
          onStepChange(newStep);
        }
      }
    } catch (error) {
      console.error('Error in wizard next step:', error);
    }
  };

  const handlePrevious = () => {
    if (isFirstStep) return;

    try {
      if (onPrevious) {
        onPrevious(activeStep, stepData[currentStepData?.id]);
      }

      const newStep = activeStep - 1;
      setActiveStep(newStep);
      if (onStepChange) {
        onStepChange(newStep);
      }
    } catch (error) {
      console.error('Error in wizard previous step:', error);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowStepNavigation) return;

    setActiveStep(stepIndex);
    if (onStepChange) {
      onStepChange(stepIndex);
    }
  };

  const updateStepData = (stepId: string, data: any) => {
    setStepData(prev => ({
      ...prev,
      [stepId]: data,
    }));
  };

  const renderStep = () => {
    if (!currentStepData) return null;

    const { component: Component, content } = currentStepData;

    if (Component) {
      return (
        <Component
          step={currentStepData}
          data={stepData[currentStepData.id]}
          updateData={(data: any) => updateStepData(currentStepData.id, data)}
          isValid={isStepValid}
        />
      );
    }

    if (content) {
      return content;
    }

    return (
      <div className="text-center text-muted-foreground">
        Step content not provided
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-[60vh]">
      {/* Header */}
      <div className="p-6 border-b border-border">
        {title && (
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {activeStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            const isClickable = allowStepNavigation;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap',
                  isActive && 'bg-primary/10 text-primary',
                  isCompleted && 'text-green-600',
                  !isActive && !isCompleted && 'text-muted-foreground',
                  isClickable && 'hover:bg-accent',
                  !isClickable && 'cursor-default'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-green-500 text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : showStepNumbers ? (
                    index + 1
                  ) : null}
                </div>
                <div className="text-left">
                  <div className="font-medium">{step.title}</div>
                  {step.description && (
                    <div className="text-xs opacity-70">{step.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 p-6">
        <div className="h-full">
          {currentStepData && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                {currentStepData.title}
              </h3>
              {currentStepData.description && (
                <p className="text-muted-foreground text-sm mb-4">
                  {currentStepData.description}
                </p>
              )}
            </div>
          )}

          <div className="min-h-[200px]">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {previousText}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLastStep ? completeText : nextText}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});