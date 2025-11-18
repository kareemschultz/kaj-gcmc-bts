"use client";

import { Check, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StepperStep {
	id: string;
	title: string;
	description?: string;
	isComplete?: boolean;
	isOptional?: boolean;
}

interface StepperProps {
	steps: StepperStep[];
	currentStep: number;
	orientation?: "horizontal" | "vertical";
	variant?: "default" | "outline" | "ghost";
	size?: "sm" | "default" | "lg";
	className?: string;
	onStepClick?: (step: number) => void;
}

export function Stepper({
	steps,
	currentStep,
	orientation = "horizontal",
	variant = "default",
	size = "default",
	className,
	onStepClick,
}: StepperProps) {
	const isHorizontal = orientation === "horizontal";

	return (
		<div
			className={cn(
				"flex",
				isHorizontal ? "items-center" : "flex-col",
				className,
			)}
		>
			{steps.map((step, index) => {
				const isActive = index === currentStep;
				const isComplete = step.isComplete || index < currentStep;
				const isLast = index === steps.length - 1;

				return (
					<React.Fragment key={step.id}>
						<div className={cn("flex items-center", !isHorizontal && "w-full")}>
							<StepIndicator
								step={step}
								index={index}
								isActive={isActive}
								isComplete={isComplete}
								variant={variant}
								size={size}
								onClick={onStepClick ? () => onStepClick(index) : undefined}
							/>
							<StepContent
								step={step}
								isActive={isActive}
								isHorizontal={isHorizontal}
								size={size}
								onClick={onStepClick ? () => onStepClick(index) : undefined}
							/>
						</div>
						{!isLast && (
							<StepSeparator
								isHorizontal={isHorizontal}
								isComplete={isComplete}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}

interface StepIndicatorProps {
	step: StepperStep;
	index: number;
	isActive: boolean;
	isComplete: boolean;
	variant: "default" | "outline" | "ghost";
	size: "sm" | "default" | "lg";
	onClick?: () => void;
}

function StepIndicator({
	step,
	index,
	isActive,
	isComplete,
	variant,
	size,
	onClick,
}: StepIndicatorProps) {
	const sizeClasses = {
		sm: "h-6 w-6 text-xs",
		default: "h-8 w-8 text-sm",
		lg: "h-10 w-10 text-base",
	};

	return (
		<Button
			variant={isActive ? "default" : isComplete ? "secondary" : "outline"}
			size="icon"
			className={cn(
				"shrink-0 rounded-full border-2",
				sizeClasses[size],
				isComplete && !isActive && "bg-primary text-primary-foreground",
				isActive && "ring-2 ring-primary ring-offset-2",
				onClick && "cursor-pointer",
				!onClick && "pointer-events-none cursor-default",
			)}
			onClick={onClick}
			disabled={!onClick}
		>
			{isComplete && !isActive ? (
				<Check className="h-4 w-4" />
			) : (
				<span className="font-medium">{index + 1}</span>
			)}
		</Button>
	);
}

interface StepContentProps {
	step: StepperStep;
	isActive: boolean;
	isHorizontal: boolean;
	size: "sm" | "default" | "lg";
	onClick?: () => void;
}

function StepContent({
	step,
	isActive,
	isHorizontal,
	size,
	onClick,
}: StepContentProps) {
	const titleSizes = {
		sm: "text-sm",
		default: "text-base",
		lg: "text-lg",
	};

	const descriptionSizes = {
		sm: "text-xs",
		default: "text-sm",
		lg: "text-base",
	};

	return (
		<div
			className={cn(
				"ml-3 flex-1",
				isHorizontal ? "max-w-[200px]" : "w-full",
				onClick && "cursor-pointer",
			)}
			onClick={onClick}
		>
			<div
				className={cn(
					"font-medium",
					titleSizes[size],
					isActive ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{step.title}
				{step.isOptional && (
					<span className="ml-1 text-muted-foreground text-xs">(optional)</span>
				)}
			</div>
			{step.description && (
				<div className={cn("text-muted-foreground", descriptionSizes[size])}>
					{step.description}
				</div>
			)}
		</div>
	);
}

interface StepSeparatorProps {
	isHorizontal: boolean;
	isComplete: boolean;
}

function StepSeparator({ isHorizontal, isComplete }: StepSeparatorProps) {
	if (isHorizontal) {
		return (
			<ChevronRight
				className={cn(
					"mx-2 h-4 w-4 shrink-0",
					isComplete ? "text-primary" : "text-muted-foreground",
				)}
			/>
		);
	}

	return (
		<div className="ml-4 flex h-6 w-px">
			<div
				className={cn("w-px flex-1", isComplete ? "bg-primary" : "bg-border")}
			/>
		</div>
	);
}

// Multi-step form wrapper component
interface MultiStepFormProps {
	steps: StepperStep[];
	currentStep: number;
	onStepChange: (step: number) => void;
	onNext?: () => void;
	onPrevious?: () => void;
	onSubmit?: () => void;
	children: React.ReactNode;
	className?: string;
	enableStepClick?: boolean;
}

export function MultiStepForm({
	steps,
	currentStep,
	onStepChange,
	onNext,
	onPrevious,
	onSubmit,
	children,
	className,
	enableStepClick = false,
}: MultiStepFormProps) {
	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === steps.length - 1;

	return (
		<div className={cn("w-full", className)}>
			<div className="mb-8">
				<Stepper
					steps={steps}
					currentStep={currentStep}
					onStepClick={enableStepClick ? onStepChange : undefined}
				/>
			</div>

			<div className="min-h-[400px]">{children}</div>

			<div className="mt-8 flex justify-between">
				<Button
					type="button"
					variant="outline"
					onClick={onPrevious}
					disabled={isFirstStep}
				>
					Previous
				</Button>

				<div className="flex gap-2">
					{isLastStep ? (
						<Button type="button" onClick={onSubmit}>
							Complete
						</Button>
					) : (
						<Button type="button" onClick={onNext}>
							Next
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
