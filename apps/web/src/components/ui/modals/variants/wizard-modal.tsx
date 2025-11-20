"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import React, { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ModalConfig } from "../modal-context";

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
	onClose,
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
		nextText = "Next",
		previousText = "Previous",
		completeText = "Complete",
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
			console.error("Error in wizard next step:", error);
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
			console.error("Error in wizard previous step:", error);
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
		setStepData((prev) => ({
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
		<div className="flex h-full min-h-[60vh] flex-col">
			{/* Header */}
			<div className="border-border border-b p-6">
				{title && <h2 className="mb-4 font-semibold text-xl">{title}</h2>}

				{/* Progress bar */}
				{showProgress && (
					<div className="mb-4">
						<div className="mb-2 flex justify-between text-muted-foreground text-sm">
							<span>
								Step {activeStep + 1} of {steps.length}
							</span>
							<span>{Math.round(progress)}% Complete</span>
						</div>
						<div className="h-2 w-full rounded-full bg-secondary">
							<div
								className="h-2 rounded-full bg-primary transition-all duration-300"
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
									"flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
									isActive && "bg-primary/10 text-primary",
									isCompleted && "text-green-600",
									!isActive && !isCompleted && "text-muted-foreground",
									isClickable && "hover:bg-accent",
									!isClickable && "cursor-default",
								)}
							>
								<div
									className={cn(
										"flex h-6 w-6 items-center justify-center rounded-full font-medium text-xs",
										isActive && "bg-primary text-primary-foreground",
										isCompleted && "bg-green-500 text-white",
										!isActive &&
											!isCompleted &&
											"bg-muted text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check className="h-3 w-3" />
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
							<h3 className="mb-2 font-semibold text-lg">
								{currentStepData.title}
							</h3>
							{currentStepData.description && (
								<p className="mb-4 text-muted-foreground text-sm">
									{currentStepData.description}
								</p>
							)}
						</div>
					)}

					<div className="min-h-[200px]">{renderStep()}</div>
				</div>
			</div>

			{/* Footer */}
			<div className="border-border border-t p-6">
				<div className="flex justify-between">
					<button
						type="button"
						onClick={handlePrevious}
						disabled={isFirstStep}
						className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						<ChevronLeft className="h-4 w-4" />
						{previousText}
					</button>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleNext}
							disabled={!isStepValid}
							className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isLastStep ? completeText : nextText}
							{!isLastStep && <ChevronRight className="h-4 w-4" />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
});
