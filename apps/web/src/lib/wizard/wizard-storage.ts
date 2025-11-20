"use client";

import type { WizardState } from "./wizard-context";

// Local storage keys
const WIZARD_STORAGE_PREFIX = "gcmc-kaj-wizard-";
const WIZARD_INDEX_KEY = "gcmc-kaj-wizard-index";

// Wizard session interface
export interface WizardSession {
	sessionId: string;
	wizardType: string;
	data: Record<string, any>;
	currentStepIndex: number;
	createdAt: Date;
	updatedAt: Date;
	expiresAt: Date;
}

// Storage service for wizard data
export class WizardStorageService {
	// Save wizard progress to local storage
	static saveToLocalStorage(
		sessionId: string,
		wizardType: string,
		state: Partial<WizardState>,
	): void {
		try {
			const session: WizardSession = {
				sessionId,
				wizardType,
				data: state.data || {},
				currentStepIndex: state.currentStepIndex || 0,
				createdAt: new Date(
					localStorage.getItem(
						`${WIZARD_STORAGE_PREFIX}${sessionId}-created`,
					) || Date.now(),
				),
				updatedAt: new Date(),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			};

			localStorage.setItem(
				`${WIZARD_STORAGE_PREFIX}${sessionId}`,
				JSON.stringify(session),
			);

			// Update index
			WizardStorageService.updateSessionIndex(sessionId, wizardType);
		} catch (error) {
			console.error("Failed to save wizard progress to local storage:", error);
		}
	}

	// Load wizard progress from local storage
	static loadFromLocalStorage(sessionId: string): WizardSession | null {
		try {
			const stored = localStorage.getItem(
				`${WIZARD_STORAGE_PREFIX}${sessionId}`,
			);
			if (!stored) return null;

			const session: WizardSession = JSON.parse(stored);

			// Check if session is expired
			if (new Date() > new Date(session.expiresAt)) {
				WizardStorageService.removeFromLocalStorage(sessionId);
				return null;
			}

			return {
				...session,
				createdAt: new Date(session.createdAt),
				updatedAt: new Date(session.updatedAt),
				expiresAt: new Date(session.expiresAt),
			};
		} catch (error) {
			console.error(
				"Failed to load wizard progress from local storage:",
				error,
			);
			return null;
		}
	}

	// Remove wizard progress from local storage
	static removeFromLocalStorage(sessionId: string): void {
		try {
			localStorage.removeItem(`${WIZARD_STORAGE_PREFIX}${sessionId}`);
			WizardStorageService.removeFromSessionIndex(sessionId);
		} catch (error) {
			console.error(
				"Failed to remove wizard progress from local storage:",
				error,
			);
		}
	}

	// Get all wizard sessions
	static getAllSessions(): WizardSession[] {
		try {
			const index = WizardStorageService.getSessionIndex();
			const sessions: WizardSession[] = [];

			for (const sessionId of index) {
				const session = WizardStorageService.loadFromLocalStorage(sessionId);
				if (session) {
					sessions.push(session);
				}
			}

			return sessions.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			);
		} catch (error) {
			console.error("Failed to get all wizard sessions:", error);
			return [];
		}
	}

	// Get sessions by wizard type
	static getSessionsByType(wizardType: string): WizardSession[] {
		return WizardStorageService.getAllSessions().filter(
			(session) => session.wizardType === wizardType,
		);
	}

	// Clean up expired sessions
	static cleanupExpiredSessions(): void {
		try {
			const sessions = WizardStorageService.getAllSessions();
			const now = new Date();

			for (const session of sessions) {
				if (now > session.expiresAt) {
					WizardStorageService.removeFromLocalStorage(session.sessionId);
				}
			}
		} catch (error) {
			console.error("Failed to cleanup expired wizard sessions:", error);
		}
	}

	// Update session index
	private static updateSessionIndex(
		sessionId: string,
		wizardType: string,
	): void {
		try {
			const index = WizardStorageService.getSessionIndex();

			if (!index.includes(sessionId)) {
				index.push(sessionId);
				localStorage.setItem(WIZARD_INDEX_KEY, JSON.stringify(index));
			}

			// Store creation time for new sessions
			const createdKey = `${WIZARD_STORAGE_PREFIX}${sessionId}-created`;
			if (!localStorage.getItem(createdKey)) {
				localStorage.setItem(createdKey, Date.now().toString());
			}
		} catch (error) {
			console.error("Failed to update session index:", error);
		}
	}

	// Remove from session index
	private static removeFromSessionIndex(sessionId: string): void {
		try {
			let index = WizardStorageService.getSessionIndex();
			index = index.filter((id) => id !== sessionId);
			localStorage.setItem(WIZARD_INDEX_KEY, JSON.stringify(index));

			// Remove creation time
			localStorage.removeItem(`${WIZARD_STORAGE_PREFIX}${sessionId}-created`);
		} catch (error) {
			console.error("Failed to remove from session index:", error);
		}
	}

	// Get session index
	private static getSessionIndex(): string[] {
		try {
			const stored = localStorage.getItem(WIZARD_INDEX_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error("Failed to get session index:", error);
			return [];
		}
	}
}

// Server-side storage service (for production use)
export class WizardServerStorageService {
	private static baseUrl = "/api/wizard-progress";

	// Save wizard progress to server
	static async saveToServer(
		sessionId: string,
		wizardType: string,
		state: Partial<WizardState>,
	): Promise<void> {
		try {
			const response = await fetch(
				`${WizardServerStorageService.baseUrl}/${sessionId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						wizardType,
						data: state.data,
						currentStepIndex: state.currentStepIndex,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					`Failed to save wizard progress: ${response.statusText}`,
				);
			}
		} catch (error) {
			console.error("Failed to save wizard progress to server:", error);
			throw error;
		}
	}

	// Load wizard progress from server
	static async loadFromServer(
		sessionId: string,
	): Promise<WizardSession | null> {
		try {
			const response = await fetch(
				`${WizardServerStorageService.baseUrl}/${sessionId}`,
			);

			if (response.status === 404) {
				return null;
			}

			if (!response.ok) {
				throw new Error(
					`Failed to load wizard progress: ${response.statusText}`,
				);
			}

			const session = await response.json();
			return {
				...session,
				createdAt: new Date(session.createdAt),
				updatedAt: new Date(session.updatedAt),
				expiresAt: new Date(session.expiresAt),
			};
		} catch (error) {
			console.error("Failed to load wizard progress from server:", error);
			throw error;
		}
	}

	// Get all sessions for current user
	static async getAllSessions(): Promise<WizardSession[]> {
		try {
			const response = await fetch(WizardServerStorageService.baseUrl);

			if (!response.ok) {
				throw new Error(
					`Failed to get wizard sessions: ${response.statusText}`,
				);
			}

			const sessions = await response.json();
			return sessions.map((session: any) => ({
				...session,
				createdAt: new Date(session.createdAt),
				updatedAt: new Date(session.updatedAt),
				expiresAt: new Date(session.expiresAt),
			}));
		} catch (error) {
			console.error("Failed to get wizard sessions from server:", error);
			throw error;
		}
	}

	// Delete wizard progress from server
	static async deleteFromServer(sessionId: string): Promise<void> {
		try {
			const response = await fetch(
				`${WizardServerStorageService.baseUrl}/${sessionId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok && response.status !== 404) {
				throw new Error(
					`Failed to delete wizard progress: ${response.statusText}`,
				);
			}
		} catch (error) {
			console.error("Failed to delete wizard progress from server:", error);
			throw error;
		}
	}
}

// Unified storage service that uses both local and server storage
export class WizardUnifiedStorageService {
	// Save to both local and server storage
	static async save(
		sessionId: string,
		wizardType: string,
		state: Partial<WizardState>,
	): Promise<void> {
		// Always save to local storage for immediate access
		WizardStorageService.saveToLocalStorage(sessionId, wizardType, state);

		// Try to save to server, but don't fail if it doesn't work
		try {
			await WizardServerStorageService.saveToServer(
				sessionId,
				wizardType,
				state,
			);
		} catch (error) {
			console.warn("Server storage failed, using local storage only:", error);
		}
	}

	// Load from server first, fallback to local storage
	static async load(sessionId: string): Promise<WizardSession | null> {
		try {
			// Try server first
			const serverSession =
				await WizardServerStorageService.loadFromServer(sessionId);
			if (serverSession) {
				return serverSession;
			}
		} catch (error) {
			console.warn("Server load failed, trying local storage:", error);
		}

		// Fallback to local storage
		return WizardStorageService.loadFromLocalStorage(sessionId);
	}

	// Get all sessions from both sources
	static async getAllSessions(): Promise<WizardSession[]> {
		let serverSessions: WizardSession[] = [];
		let localSessions: WizardSession[] = [];

		try {
			serverSessions = await WizardServerStorageService.getAllSessions();
		} catch (error) {
			console.warn("Failed to load server sessions:", error);
		}

		try {
			localSessions = WizardStorageService.getAllSessions();
		} catch (error) {
			console.warn("Failed to load local sessions:", error);
		}

		// Merge and deduplicate sessions (server takes precedence)
		const sessionMap = new Map<string, WizardSession>();

		for (const session of localSessions) {
			sessionMap.set(session.sessionId, session);
		}

		for (const session of serverSessions) {
			sessionMap.set(session.sessionId, session);
		}

		return Array.from(sessionMap.values()).sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	}

	// Delete from both storages
	static async delete(sessionId: string): Promise<void> {
		WizardStorageService.removeFromLocalStorage(sessionId);

		try {
			await WizardServerStorageService.deleteFromServer(sessionId);
		} catch (error) {
			console.warn("Server delete failed:", error);
		}
	}
}
