/**
 * Accessibility Utilities and WCAG 2.1 AA Compliance Helpers
 *
 * Comprehensive accessibility features including:
 * - Keyboard navigation helpers
 * - Screen reader optimization
 * - Focus management utilities
 * - Color contrast validation
 * - ARIA attribute helpers
 * - Mobile accessibility features
 */

// WCAG 2.1 AA Color Contrast Ratios
export const CONTRAST_RATIOS = {
	AA_NORMAL: 4.5,
	AA_LARGE: 3,
	AAA_NORMAL: 7,
	AAA_LARGE: 4.5,
} as const;

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
	const [rs, gs, bs] = [r, g, b].map(c => {
		c = c / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
	// Convert hex to RGB
	const hex1 = color1.replace('#', '');
	const hex2 = color2.replace('#', '');

	const r1 = parseInt(hex1.substr(0, 2), 16);
	const g1 = parseInt(hex1.substr(2, 2), 16);
	const b1 = parseInt(hex1.substr(4, 2), 16);

	const r2 = parseInt(hex2.substr(0, 2), 16);
	const g2 = parseInt(hex2.substr(2, 2), 16);
	const b2 = parseInt(hex2.substr(4, 2), 16);

	const l1 = getRelativeLuminance(r1, g1, b1);
	const l2 = getRelativeLuminance(r2, g2, b2);

	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
	foreground: string,
	background: string,
	level: 'AA' | 'AAA' = 'AA',
	size: 'normal' | 'large' = 'normal'
): boolean {
	const ratio = getContrastRatio(foreground, background);
	const requirement = level === 'AA'
		? (size === 'large' ? CONTRAST_RATIOS.AA_LARGE : CONTRAST_RATIOS.AA_NORMAL)
		: (size === 'large' ? CONTRAST_RATIOS.AAA_LARGE : CONTRAST_RATIOS.AAA_NORMAL);

	return ratio >= requirement;
}

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
	/**
	 * Handle arrow key navigation in lists
	 */
	handleArrowKeys: (
		event: KeyboardEvent,
		items: HTMLElement[],
		currentIndex: number,
		onSelect: (index: number) => void
	) => {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				onSelect(nextIndex);
				items[nextIndex]?.focus();
				break;
			case 'ArrowUp':
				event.preventDefault();
				const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				onSelect(prevIndex);
				items[prevIndex]?.focus();
				break;
			case 'Home':
				event.preventDefault();
				onSelect(0);
				items[0]?.focus();
				break;
			case 'End':
				event.preventDefault();
				const lastIndex = items.length - 1;
				onSelect(lastIndex);
				items[lastIndex]?.focus();
				break;
		}
	},

	/**
	 * Handle escape key to close modals/dropdowns
	 */
	handleEscape: (event: KeyboardEvent, onEscape: () => void) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			onEscape();
		}
	},

	/**
	 * Handle enter/space for activation
	 */
	handleActivation: (event: KeyboardEvent, onActivate: () => void) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onActivate();
		}
	},
};

/**
 * Focus management utilities
 */
export const focusManagement = {
	/**
	 * Trap focus within an element
	 */
	trapFocus: (container: HTMLElement) => {
		const focusableElements = container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		) as NodeListOf<HTMLElement>;

		if (focusableElements.length === 0) return () => {};

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		const handleTabKey = (event: KeyboardEvent) => {
			if (event.key === 'Tab') {
				if (event.shiftKey) {
					if (document.activeElement === firstElement) {
						event.preventDefault();
						lastElement.focus();
					}
				} else {
					if (document.activeElement === lastElement) {
						event.preventDefault();
						firstElement.focus();
					}
				}
			}
		};

		container.addEventListener('keydown', handleTabKey);
		firstElement.focus();

		return () => {
			container.removeEventListener('keydown', handleTabKey);
		};
	},

	/**
	 * Return focus to previously focused element
	 */
	restoreFocus: (previousElement: HTMLElement | null) => {
		if (previousElement && document.contains(previousElement)) {
			previousElement.focus();
		}
	},

	/**
	 * Get all focusable elements within a container
	 */
	getFocusableElements: (container: HTMLElement): HTMLElement[] => {
		return Array.from(
			container.querySelectorAll(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
			)
		) as HTMLElement[];
	},
};

/**
 * ARIA helpers
 */
export const ariaHelpers = {
	/**
	 * Generate unique IDs for ARIA relationships
	 */
	generateId: (prefix: string = 'aria'): string => {
		return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
	},

	/**
	 * Create ARIA attributes for form validation
	 */
	getValidationAttributes: (
		error: string | null,
		required: boolean = false,
		describedBy?: string
	) => {
		const attributes: Record<string, any> = {
			'aria-required': required,
			'aria-invalid': !!error,
		};

		if (error || describedBy) {
			attributes['aria-describedby'] = describedBy || ariaHelpers.generateId('error');
		}

		return attributes;
	},

	/**
	 * Create ARIA attributes for expandable content
	 */
	getExpandableAttributes: (expanded: boolean, controlsId?: string) => ({
		'aria-expanded': expanded,
		'aria-controls': controlsId,
	}),

	/**
	 * Create ARIA attributes for live regions
	 */
	getLiveRegionAttributes: (politeness: 'polite' | 'assertive' = 'polite') => ({
		'aria-live': politeness,
		'aria-atomic': true,
	}),
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
	/**
	 * Create visually hidden content for screen readers
	 */
	visuallyHiddenClass: 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',

	/**
	 * Announce content to screen readers
	 */
	announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
		const announcer = document.createElement('div');
		announcer.setAttribute('aria-live', priority);
		announcer.setAttribute('aria-atomic', 'true');
		announcer.className = screenReaderUtils.visuallyHiddenClass;
		announcer.textContent = message;

		document.body.appendChild(announcer);

		setTimeout(() => {
			document.body.removeChild(announcer);
		}, 1000);
	},

	/**
	 * Create accessible progress announcement
	 */
	announceProgress: (current: number, total: number, context?: string) => {
		const percentage = Math.round((current / total) * 100);
		const message = context
			? `${context}: ${percentage}% complete, ${current} of ${total}`
			: `Progress: ${percentage}% complete, ${current} of ${total}`;

		screenReaderUtils.announce(message, 'polite');
	},
};

/**
 * Mobile accessibility helpers
 */
export const mobileA11y = {
	/**
	 * Get touch target size recommendations
	 */
	getTouchTargetClass: (size: 'small' | 'medium' | 'large' = 'medium') => {
		const sizes = {
			small: 'min-h-[36px] min-w-[36px]', // 36px minimum for WCAG
			medium: 'min-h-[44px] min-w-[44px]', // 44px recommended
			large: 'min-h-[48px] min-w-[48px]', // 48px for enhanced usability
		};
		return sizes[size];
	},

	/**
	 * Handle reduced motion preferences
	 */
	respectsReducedMotion: (): boolean => {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	},

	/**
	 * Get animation class based on motion preferences
	 */
	getAnimationClass: (animationClass: string, fallbackClass?: string) => {
		if (typeof window === 'undefined') return animationClass;
		return mobileA11y.respectsReducedMotion()
			? (fallbackClass || '')
			: animationClass;
	},
};

/**
 * Compliance checker for WCAG 2.1 AA
 */
export const complianceChecker = {
	/**
	 * Check if an element meets accessibility requirements
	 */
	checkElement: (element: HTMLElement): AccessibilityIssue[] => {
		const issues: AccessibilityIssue[] = [];

		// Check for missing alt text on images
		if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
			issues.push({
				type: 'missing_alt_text',
				severity: 'error',
				message: 'Image missing alt text',
				element,
			});
		}

		// Check for missing labels on form inputs
		if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
			const id = element.getAttribute('id');
			const ariaLabel = element.getAttribute('aria-label');
			const ariaLabelledBy = element.getAttribute('aria-labelledby');

			if (!ariaLabel && !ariaLabelledBy && id) {
				const label = document.querySelector(`label[for="${id}"]`);
				if (!label) {
					issues.push({
						type: 'missing_label',
						severity: 'error',
						message: 'Form input missing label',
						element,
					});
				}
			}
		}

		// Check touch target size on mobile
		if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
			const rect = element.getBoundingClientRect();
			if (rect.width < 44 || rect.height < 44) {
				issues.push({
					type: 'small_touch_target',
					severity: 'warning',
					message: 'Touch target smaller than 44px',
					element,
				});
			}
		}

		return issues;
	},

	/**
	 * Run full page accessibility audit
	 */
	auditPage: (): AccessibilityReport => {
		const issues: AccessibilityIssue[] = [];
		const elements = document.querySelectorAll('*');

		elements.forEach(element => {
			issues.push(...complianceChecker.checkElement(element as HTMLElement));
		});

		const errors = issues.filter(i => i.severity === 'error');
		const warnings = issues.filter(i => i.severity === 'warning');

		return {
			errors: errors.length,
			warnings: warnings.length,
			issues,
			score: Math.max(0, 100 - (errors.length * 10 + warnings.length * 5)),
		};
	},
};

export interface AccessibilityIssue {
	type: string;
	severity: 'error' | 'warning';
	message: string;
	element: HTMLElement;
}

export interface AccessibilityReport {
	errors: number;
	warnings: number;
	issues: AccessibilityIssue[];
	score: number;
}