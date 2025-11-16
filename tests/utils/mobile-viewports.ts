import type { Browser, BrowserContext } from "@playwright/test";

/**
 * Mobile Viewport Presets
 *
 * Common mobile and tablet viewport configurations for responsive testing.
 */
export const MobileViewports = {
	// Phones - Portrait
	iPhoneSE: {
		viewport: { width: 375, height: 667 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	iPhone13: {
		viewport: { width: 390, height: 844 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},
	iPhone13Pro: {
		viewport: { width: 428, height: 926 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},
	Pixel5: {
		viewport: { width: 393, height: 851 },
		userAgent:
			"Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
		deviceScaleFactor: 2.75,
		isMobile: true,
		hasTouch: true,
	},
	SamsungGalaxyS21: {
		viewport: { width: 360, height: 800 },
		userAgent:
			"Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},

	// Phones - Landscape
	iPhoneSE_Landscape: {
		viewport: { width: 667, height: 375 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	iPhone13_Landscape: {
		viewport: { width: 844, height: 390 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},

	// Tablets - Portrait
	iPadMini: {
		viewport: { width: 768, height: 1024 },
		userAgent:
			"Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	iPadPro11: {
		viewport: { width: 834, height: 1194 },
		userAgent:
			"Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	iPadPro129: {
		viewport: { width: 1024, height: 1366 },
		userAgent:
			"Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},

	// Tablets - Landscape
	iPadMini_Landscape: {
		viewport: { width: 1024, height: 768 },
		userAgent:
			"Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	iPadPro11_Landscape: {
		viewport: { width: 1194, height: 834 },
		userAgent:
			"Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
};

/**
 * Helper to create mobile context
 */
export async function createMobileContext(
	browser: Browser,
	device: keyof typeof MobileViewports,
): Promise<BrowserContext> {
	const config = MobileViewports[device];
	return await browser.newContext(config);
}

/**
 * Helper to test across multiple mobile viewports
 */
export async function testAcrossMobileViewports(
	browser: Browser,
	devices: (keyof typeof MobileViewports)[],
	testFn: (context: BrowserContext, deviceName: string) => Promise<void>,
) {
	for (const device of devices) {
		const context = await createMobileContext(browser, device);
		try {
			await testFn(context, device);
		} finally {
			await context.close();
		}
	}
}
