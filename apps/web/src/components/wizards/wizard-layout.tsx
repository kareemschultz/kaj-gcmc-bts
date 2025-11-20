"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Save,
	X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useWizard, type WizardStep } from "@/lib/wizard/wizard-context";

interface WizardLayoutProps {
	title: string;
	subtitle?: string;
	onExit?: () => void;
	showSaveIndicator?: boolean;
	enableKeyboardNavigation?: boolean;
	mobileOptimized?: boolean;
	children: React.ReactNode;
}

export function WizardLayout({
	title,
	subtitle,
	onExit,
	showSaveIndicator = true,
	enableKeyboardNavigation = true,
	mobileOptimized = true,
	children,
}: WizardLayoutProps) {
	const {
		state,
		currentStep,
		nextStep,
		previousStep,
		canGoNext,
		canGoPrevious,
		progress,
		saveProgress,
		validateCurrentStep,
		dispatch,
	} = useWizard();

	const [showExitDialog, setShowExitDialog] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(
		state.savedAt || null,
	);

	// Handle keyboard navigation
	useEffect(() => {
		if (!enableKeyboardNavigation) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case "ArrowLeft":
						e.preventDefault();
						if (canGoPrevious) previousStep();
						break;
					case "ArrowRight":
						e.preventDefault();
						handleNext();
						break;
					case "s":
						e.preventDefault();
						handleSave();
						break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [enableKeyboardNavigation, canGoPrevious, canGoNext]);

	// Handle next step with validation
	const handleNext = async () => {
		setIsValidating(true);
		try {
			const isValid = await validateCurrentStep();
			if (isValid || currentStep.canSkip) {
				nextStep();
			}
		} finally {
			setIsValidating(false);
		}
	};

	// Handle save progress
	const handleSave = async () => {
		try {
			await saveProgress();
			setLastSaved(new Date());
			toast.success("Progress saved successfully");
		} catch (error) {
			toast.error("Failed to save progress");
		}
	};

	// Handle exit
	const handleExit = () => {
		if (state.hasUnsavedChanges) {
			setShowExitDialog(true);
		} else {
			onExit?.();
		}
	};

	const stepErrors = state.errors[currentStep.id] || [];

	return (
		<div
			className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 ${mobileOptimized ? "px-4" : "px-8"} py-6`}
		>
			{/* Header */}
			<div className="mx-auto max-w-4xl">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex-1">
						<h1 className="font-bold text-2xl text-gray-900 md:text-3xl">
							{title}
						</h1>
						{subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
					</div>

					{/* Save indicator and exit button */}
					<div className="flex items-center gap-3">
						{showSaveIndicator && (
							<div className="flex items-center gap-2 text-gray-500 text-sm">
								{state.hasUnsavedChanges ? (
									<>
										<Clock className="h-4 w-4" />
										<span>Unsaved changes</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleSave}
											className="text-blue-600 hover:text-blue-700"
										>
											<Save className="h-4 w-4" />
										</Button>
									</>
								) : lastSaved ? (
									<>
										<CheckCircle className="h-4 w-4 text-green-500" />
										<span>Saved {lastSaved.toLocaleTimeString()}</span>
									</>
								) : null}
							</div>
						)}

						{onExit && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleExit}
								className="text-gray-500 hover:text-gray-700"
							>
								<X className="h-4 w-4" />
								<span className="hidden sm:inline">Exit</span>
							</Button>
						)}
					</div>
				</div>

				{/* Progress bar */}
				<div className="mb-8">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-medium text-gray-700 text-sm">
							Step {state.currentStepIndex + 1} of {state.steps.length}
						</span>
						<span className="text-gray-500 text-sm">
							{Math.round(progress)}% complete
						</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				{/* Step indicators */}
				<div
					className={`mb-8 overflow-x-auto ${mobileOptimized ? "pb-2" : ""}`}
				>
					<div className="flex min-w-max items-center space-x-2 md:min-w-0 md:space-x-4">
						{state.steps.map((step, index) => (
							<React.Fragment key={step.id}>
								<div
									className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-colors ${
										index === state.currentStepIndex
											? "bg-blue-100 text-blue-900"
											: index < state.currentStepIndex
												? "bg-green-100 text-green-900"
												: "bg-gray-100 text-gray-600"
									} ${mobileOptimized ? "min-w-0" : ""}`}
								>
									<div
										className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold text-xs ${
											index === state.currentStepIndex
												? "bg-blue-600 text-white"
												: index < state.currentStepIndex
													? "bg-green-600 text-white"
													: "bg-gray-400 text-white"
										}`}
									>
										{index < state.currentStepIndex ? (
											<CheckCircle className="h-4 w-4" />
										) : (
											index + 1
										)}
									</div>
									<span
										className={`font-medium ${mobileOptimized ? "hidden truncate sm:inline" : ""}`}
									>
										{step.title}
									</span>
									{step.isOptional && (
										<span className="hidden text-gray-500 text-xs md:inline">
											(optional)
										</span>
									)}
								</div>
								{index < state.steps.length - 1 && (
									<div className="hidden h-px w-4 bg-gray-300 md:block" />
								)}
							</React.Fragment>
						))}
					</div>
				</div>

				{/* Main content */}
				<Card className="mb-8 shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-3">
							{currentStep.icon}
							<div>
								<h2 className="text-xl">{currentStep.title}</h2>
								{currentStep.description && (
									<p className="mt-1 text-gray-600 text-sm">
										{currentStep.description}
									</p>
								)}
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Error display */}
						{stepErrors.length > 0 && (
							<div className="mb-6 rounded-lg bg-red-50 p-4">
								<h4 className="font-semibold text-red-900">
									Please fix the following errors:
								</h4>
								<ul className="mt-2 space-y-1">
									{stepErrors.map((error, index) => (
										<li key={index} className="text-red-800 text-sm">
											• {error}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Step content with animation */}
						<AnimatePresence mode="wait">
							<motion.div
								key={currentStep.id}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								{children}
							</motion.div>
						</AnimatePresence>
					</CardContent>
				</Card>

				{/* Navigation */}
				<div className="flex items-center justify-between">
					<Button
						variant="outline"
						onClick={previousStep}
						disabled={!canGoPrevious}
						className="flex items-center gap-2"
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="hidden sm:inline">Previous</span>
						<span className="sm:hidden">Back</span>
					</Button>

					<div className="flex items-center gap-2">
						{currentStep.canSkip && canGoNext && (
							<Button variant="ghost" onClick={nextStep}>
								Skip
							</Button>
						)}

						{canGoNext ? (
							<Button
								onClick={handleNext}
								disabled={isValidating}
								className="flex items-center gap-2"
							>
								<span className="hidden sm:inline">
									{isValidating ? "Validating..." : "Next"}
								</span>
								<span className="sm:hidden">
									{isValidating ? "..." : "Next"}
								</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
						) : (
							<Button
								onClick={() => {
									dispatch({ type: "COMPLETE_WIZARD" });
									toast.success("Wizard completed successfully!");
									if (onExit) onExit();
								}}
								className="bg-green-600 text-white hover:bg-green-700"
							>
								Complete
							</Button>
						)}
					</div>
				</div>

				{/* Exit confirmation dialog */}
				<Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Confirm Exit</DialogTitle>
							<DialogDescription>
								You have unsaved changes. Are you sure you want to exit without
								saving?
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setShowExitDialog(false)}
							>
								Cancel
							</Button>
							<Button
								variant="outline"
								onClick={async () => {
									await handleSave();
									setShowExitDialog(false);
									onExit?.();
								}}
							>
								Save & Exit
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									setShowExitDialog(false);
									onExit?.();
								}}
							>
								Exit Without Saving
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Mobile optimization: Floating action button for save */}
				{mobileOptimized && state.hasUnsavedChanges && (
					<div className="fixed right-4 bottom-4 md:hidden">
						<Button
							onClick={handleSave}
							className="rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
						>
							<Save className="h-5 w-5" />
						</Button>
					</div>
				)}

				{/* Keyboard shortcuts help */}
				{enableKeyboardNavigation && (
					<div className="mt-8 hidden lg:block">
						<div className="rounded-lg bg-gray-50 p-4">
							<h4 className="font-medium text-gray-900">Keyboard Shortcuts</h4>
							<div className="mt-2 grid grid-cols-2 gap-4 text-gray-600 text-sm">
								<div>
									<kbd className="rounded bg-gray-200 px-2 py-1">
										Ctrl/Cmd + ←
									</kbd>
									<span className="ml-2">Previous step</span>
								</div>
								<div>
									<kbd className="rounded bg-gray-200 px-2 py-1">
										Ctrl/Cmd + →
									</kbd>
									<span className="ml-2">Next step</span>
								</div>
								<div>
									<kbd className="rounded bg-gray-200 px-2 py-1">
										Ctrl/Cmd + S
									</kbd>
									<span className="ml-2">Save progress</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
