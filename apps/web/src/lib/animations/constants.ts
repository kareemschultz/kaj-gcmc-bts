/**
 * Animation Constants
 * Standardized timing, easing, and configuration values for consistent animations
 */

import type { AnimationConfig, AnimationPresets } from "./types";

// Timing constants (in milliseconds)
export const ANIMATION_DURATIONS = {
	instant: 0,
	fastest: 100,
	fast: 200,
	normal: 300,
	slow: 500,
	slower: 700,
	slowest: 1000,
} as const;

// Spring configurations
export const SPRING_CONFIGS = {
	gentle: { type: "spring", stiffness: 120, damping: 14, mass: 1 },
	wobbly: { type: "spring", stiffness: 180, damping: 12, mass: 1 },
	stiff: { type: "spring", stiffness: 400, damping: 30, mass: 1 },
	slow: { type: "spring", stiffness: 100, damping: 15, mass: 1.2 },
	molasses: { type: "spring", stiffness: 60, damping: 20, mass: 2 },
} as const;

// Easing curves
export const EASING_CURVES = {
	linear: [0, 0, 1, 1],
	ease: [0.25, 0.1, 0.25, 1],
	easeIn: [0.42, 0, 1, 1],
	easeOut: [0, 0, 0.58, 1],
	easeInOut: [0.42, 0, 0.58, 1],
	easeInQuad: [0.55, 0.085, 0.68, 0.53],
	easeOutQuad: [0.25, 0.46, 0.45, 0.94],
	easeInCubic: [0.55, 0.055, 0.675, 0.19],
	easeOutCubic: [0.215, 0.61, 0.355, 1],
	easeInQuart: [0.895, 0.03, 0.685, 0.22],
	easeOutQuart: [0.165, 0.84, 0.44, 1],
	easeInQuint: [0.755, 0.05, 0.855, 0.06],
	easeOutQuint: [0.23, 1, 0.32, 1],
	easeInSine: [0.47, 0, 0.745, 0.715],
	easeOutSine: [0.39, 0.575, 0.565, 1],
	easeInExpo: [0.95, 0.05, 0.795, 0.035],
	easeOutExpo: [0.19, 1, 0.22, 1],
	easeInCirc: [0.6, 0.04, 0.98, 0.335],
	easeOutCirc: [0.075, 0.82, 0.165, 1],
	easeInBack: [0.6, -0.28, 0.735, 0.045],
	easeOutBack: [0.175, 0.885, 0.32, 1.275],
} as const;

// Default animation configuration
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
	enabled: true,
	respectMotionPreference: true,
	defaultSpeed: "normal",
	defaultEasing: "easeOut",
	enableGPUAcceleration: true,
	frameRateTarget: 60,
	maxConcurrentAnimations: 20,
	reduceMotion: false,
	highContrast: false,
	showProgressAnimations: true,
	enableDataVisualizationAnimations: true,
	enableFormValidationAnimations: true,
};

// Performance optimization settings
export const PERFORMANCE_SETTINGS = {
	willChangeProperties: ["transform", "opacity", "filter"],
	gpuAcceleratedProperties: ["transform", "opacity", "filter"],
	maxAnimationDuration: 3000, // Maximum duration for any single animation
	frameDropThreshold: 5, // Frames to drop before performance warning
	memoryThreshold: 100 * 1024 * 1024, // 100MB memory threshold
} as const;

// Intersection Observer settings for scroll animations
export const SCROLL_ANIMATION_CONFIG = {
	threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
	rootMargin: "-10% 0px -10% 0px",
	triggerOnce: true,
} as const;

// Default animation presets
export const DEFAULT_ANIMATION_PRESETS: AnimationPresets = {
	button: {
		hover: {
			whileHover: { scale: 1.02, y: -2 },
			transition: { type: "spring", stiffness: 400, damping: 17 },
		},
		press: {
			whileTap: { scale: 0.98, y: 0 },
			transition: { type: "spring", stiffness: 400, damping: 17 },
		},
		focus: {
			whileFocus: {
				boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5)",
				outline: "2px solid transparent",
			},
			transition: { duration: 0.2 },
		},
		disabled: {
			animate: { opacity: 0.6, scale: 1 },
			transition: { duration: 0.2 },
		},
	},

	input: {
		focus: {
			whileFocus: {
				borderColor: "#3b82f6",
				boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
			},
			transition: { duration: 0.2 },
		},
		blur: {
			animate: {
				borderColor: "#d1d5db",
				boxShadow: "0 0 0 0px transparent",
			},
			transition: { duration: 0.2 },
		},
		error: {
			animate: {
				borderColor: "#ef4444",
				x: [0, -10, 10, -10, 10, 0],
			},
			transition: { duration: 0.4 },
		},
		success: {
			animate: {
				borderColor: "#10b981",
				scale: [1, 1.02, 1],
			},
			transition: { duration: 0.3 },
		},
	},

	page: {
		enter: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
			transition: { duration: 0.3, ease: EASING_CURVES.easeOut },
		},
		exit: {
			exit: { opacity: 0, y: -20 },
			transition: { duration: 0.2, ease: EASING_CURVES.easeIn },
		},
	},

	compliance: {
		scoreUpdate: {
			animate: {
				scale: [1, 1.1, 1],
				rotate: [0, 5, -5, 0],
			},
			transition: { duration: 0.6, ease: EASING_CURVES.easeOut },
		},
		deadlineWarning: {
			animate: {
				backgroundColor: ["#fef3c7", "#fed7aa", "#fef3c7"],
				scale: [1, 1.02, 1],
			},
			transition: {
				duration: 1,
				repeat: Number.POSITIVE_INFINITY,
				repeatType: "reverse",
			},
		},
		statusChange: {
			initial: { opacity: 0, x: -20 },
			animate: { opacity: 1, x: 0 },
			transition: { type: "spring", stiffness: 300, damping: 20 },
		},
	},

	charts: {
		enter: {
			initial: { opacity: 0, scale: 0.8 },
			animate: { opacity: 1, scale: 1 },
			transition: { duration: 0.5, ease: EASING_CURVES.easeOut },
		},
		update: {
			animate: { scale: [1, 1.05, 1] },
			transition: { duration: 0.4 },
		},
		highlight: {
			whileHover: { scale: 1.1, zIndex: 10 },
			transition: { type: "spring", stiffness: 400, damping: 17 },
		},
	},
};

// Stagger configurations for list animations
export const STAGGER_CONFIGS = {
	list: {
		container: {
			animate: {
				transition: {
					staggerChildren: 0.1,
					delayChildren: 0.1,
				},
			},
		},
		item: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
			transition: { duration: 0.3 },
		},
	},
	grid: {
		container: {
			animate: {
				transition: {
					staggerChildren: 0.05,
					delayChildren: 0.2,
				},
			},
		},
		item: {
			initial: { opacity: 0, scale: 0.8 },
			animate: { opacity: 1, scale: 1 },
			transition: { duration: 0.4 },
		},
	},
	cards: {
		container: {
			animate: {
				transition: {
					staggerChildren: 0.15,
					delayChildren: 0.3,
				},
			},
		},
		item: {
			initial: { opacity: 0, y: 40, rotateY: -10 },
			animate: { opacity: 1, y: 0, rotateY: 0 },
			transition: { duration: 0.5, ease: EASING_CURVES.easeOut },
		},
	},
};

// Mobile-specific configurations
export const MOBILE_ANIMATION_CONFIG = {
	reducedMotion: true,
	maxDuration: 250,
	preferTransforms: true,
	enableHapticFeedback: true,
	touchThreshold: {
		swipe: 50,
		pan: 10,
		pinch: 0.1,
		rotate: 15,
	},
};

// Accessibility configurations
export const A11Y_ANIMATION_CONFIG = {
	respectsReducedMotion: true,
	providesAlternativeText: true,
	maintainsFocusOrder: true,
	announcesChanges: true,
	keyboardNavigable: true,
};
