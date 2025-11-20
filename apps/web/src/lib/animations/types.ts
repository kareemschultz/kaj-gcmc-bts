/**
 * Animation System Types
 * Comprehensive type definitions for the GCMC-KAJ animation framework
 */

export type AnimationSpeed = "slow" | "normal" | "fast";
export type AnimationEasing =
	| "linear"
	| "ease"
	| "easeIn"
	| "easeOut"
	| "easeInOut"
	| "spring"
	| "bounce";
export type AnimationDirection =
	| "normal"
	| "reverse"
	| "alternate"
	| "alternateReverse";

export interface AnimationConfig {
	// Global settings
	enabled: boolean;
	respectMotionPreference: boolean;
	defaultSpeed: AnimationSpeed;
	defaultEasing: AnimationEasing;

	// Performance settings
	enableGPUAcceleration: boolean;
	frameRateTarget: number;
	maxConcurrentAnimations: number;

	// Accessibility
	reduceMotion: boolean;
	highContrast: boolean;

	// Business-specific
	showProgressAnimations: boolean;
	enableDataVisualizationAnimations: boolean;
	enableFormValidationAnimations: boolean;
}

export interface AnimationPresets {
	// Core interactions
	button: {
		hover: AnimationVariant;
		press: AnimationVariant;
		focus: AnimationVariant;
		disabled: AnimationVariant;
	};

	// Form elements
	input: {
		focus: AnimationVariant;
		blur: AnimationVariant;
		error: AnimationVariant;
		success: AnimationVariant;
	};

	// Layout animations
	page: {
		enter: AnimationVariant;
		exit: AnimationVariant;
	};

	// Business-specific
	compliance: {
		scoreUpdate: AnimationVariant;
		deadlineWarning: AnimationVariant;
		statusChange: AnimationVariant;
	};

	// Data visualization
	charts: {
		enter: AnimationVariant;
		update: AnimationVariant;
		highlight: AnimationVariant;
	};
}

export interface AnimationVariant {
	initial?: Record<string, any>;
	animate?: Record<string, any>;
	exit?: Record<string, any>;
	transition?: {
		duration?: number;
		delay?: number;
		ease?: string | number[];
		type?: "spring" | "tween" | "inertia";
		stiffness?: number;
		damping?: number;
		mass?: number;
		velocity?: number;
		restSpeed?: number;
		restDelta?: number;
		bounce?: number;
		times?: number[];
		repeat?: number;
		repeatType?: "loop" | "reverse" | "mirror";
		repeatDelay?: number;
	};
	whileHover?: Record<string, any>;
	whileTap?: Record<string, any>;
	whileFocus?: Record<string, any>;
	whileInView?: Record<string, any>;
}

export interface MicroInteraction {
	id: string;
	name: string;
	description: string;
	variants: AnimationVariant;
	accessibility: {
		respectsReducedMotion: boolean;
		providesHapticFeedback?: boolean;
		announceToScreenReader?: boolean;
	};
	performance: {
		gpuOptimized: boolean;
		willChange?: string[];
		containment?: boolean;
	};
}

export interface BusinessAnimation {
	id: string;
	context:
		| "tax-filing"
		| "compliance"
		| "document-management"
		| "client-portal"
		| "dashboard";
	animation: AnimationVariant;
	triggers: {
		onMount?: boolean;
		onUpdate?: boolean;
		onSuccess?: boolean;
		onError?: boolean;
		onProgress?: boolean;
	};
}

export interface PerformanceMetrics {
	frameRate: number;
	animationCount: number;
	memoryUsage: number;
	cpuUsage: number;
	droppedFrames: number;
	timestamp: number;
}

export interface GestureConfig {
	enabled: boolean;
	threshold: {
		swipe: number;
		pan: number;
		pinch: number;
		rotate: number;
	};
	feedback: {
		haptic: boolean;
		visual: boolean;
		audio: boolean;
	};
}

export interface AnimationContext {
	config: AnimationConfig;
	presets: AnimationPresets;
	updateConfig: (updates: Partial<AnimationConfig>) => void;
	registerMicroInteraction: (interaction: MicroInteraction) => void;
	registerBusinessAnimation: (animation: BusinessAnimation) => void;
	getPerformanceMetrics: () => PerformanceMetrics;
	resetAnimations: () => void;
}

export interface ScrollAnimationConfig {
	threshold: number;
	rootMargin: string;
	triggerOnce: boolean;
	stagger: number;
}

// Utility types
export type AnimationTrigger =
	| "hover"
	| "focus"
	| "click"
	| "scroll"
	| "mount"
	| "unmount"
	| "update";
export type AnimationProperty =
	| "opacity"
	| "scale"
	| "x"
	| "y"
	| "rotate"
	| "skew"
	| "backgroundColor"
	| "color";

export interface KeyframeAnimation {
	property: AnimationProperty;
	keyframes: Array<{ time: number; value: any; ease?: AnimationEasing }>;
	duration: number;
	delay?: number;
	repeat?: number;
}
