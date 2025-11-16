"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: (
		error: Error,
		errorInfo: ErrorInfo,
		reset: () => void,
	) => ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	onReset?: () => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree.
 *
 * Features:
 * - Catches rendering errors in child components
 * - Logs errors with structured format (ready for Sentry integration)
 * - Shows detailed error information in development mode
 * - Shows user-friendly error message in production mode
 * - Provides "Try Again" and "Go Home" actions
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		// Update state so the next render will show the fallback UI
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error with structured format for monitoring services (e.g., Sentry)
		const isDevelopment = process.env.NODE_ENV === "development";

		console.error("[ErrorBoundary] Caught an error:", {
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack,
			},
			errorInfo: {
				componentStack: errorInfo.componentStack,
			},
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
		});

		// In development, also log to console for easier debugging
		if (isDevelopment) {
			console.error("Error details:", error);
			console.error("Component stack:", errorInfo.componentStack);
		}

		// Update state with error info
		this.setState({
			errorInfo,
		});

		// Call optional error handler
		this.props.onError?.(error, errorInfo);
	}

	resetErrorBoundary = (): void => {
		this.props.onReset?.();
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	handleGoHome = (): void => {
		this.resetErrorBoundary();
		// Navigate to home page
		if (typeof window !== "undefined") {
			window.location.href = "/";
		}
	};

	render(): ReactNode {
		const { hasError, error, errorInfo } = this.state;
		const { children, fallback } = this.props;

		if (hasError && error && errorInfo) {
			// Use custom fallback if provided
			if (fallback) {
				return fallback(error, errorInfo, this.resetErrorBoundary);
			}

			// Default fallback UI
			const isDevelopment = process.env.NODE_ENV === "development";

			return (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						minHeight: "100vh",
						padding: "1.5rem",
						backgroundColor: "hsl(var(--background))",
					}}
				>
					<div
						style={{
							maxWidth: "48rem",
							width: "100%",
							borderRadius: "0.75rem",
							border: "1px solid hsl(var(--border))",
							backgroundColor: "hsl(var(--card))",
							padding: "1.5rem",
							boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
						}}
					>
						<div style={{ marginBottom: "1.5rem" }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									marginBottom: "0.5rem",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										width: "3rem",
										height: "3rem",
										borderRadius: "9999px",
										backgroundColor: "hsl(var(--destructive) / 0.1)",
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="hsl(var(--destructive))"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-label="Error icon"
										role="img"
									>
										<circle cx="12" cy="12" r="10" />
										<line x1="12" y1="8" x2="12" y2="12" />
										<line x1="12" y1="16" x2="12.01" y2="16" />
									</svg>
								</div>
								<h1
									style={{
										fontSize: "1.5rem",
										fontWeight: "600",
										lineHeight: "1",
										color: "hsl(var(--foreground))",
									}}
								>
									Something went wrong
								</h1>
							</div>
							<p
								style={{
									fontSize: "0.875rem",
									color: "hsl(var(--muted-foreground))",
									marginTop: "0.5rem",
								}}
							>
								{isDevelopment
									? "An error occurred while rendering this component. See details below."
									: "We're sorry, but something unexpected happened. Please try again or return to the home page."}
							</p>
						</div>

						{isDevelopment && (
							<div
								style={{
									marginBottom: "1.5rem",
									borderRadius: "0.5rem",
									backgroundColor: "hsl(var(--muted))",
									padding: "1rem",
								}}
							>
								<div style={{ marginBottom: "0.75rem" }}>
									<h2
										style={{
											fontSize: "0.875rem",
											fontWeight: "600",
											color: "hsl(var(--foreground))",
											marginBottom: "0.5rem",
										}}
									>
										Error: {error.name}
									</h2>
									<p
										style={{
											fontSize: "0.875rem",
											color: "hsl(var(--foreground))",
											fontFamily: "monospace",
										}}
									>
										{error.message}
									</p>
								</div>

								{error.stack && (
									<details style={{ marginTop: "0.75rem" }}>
										<summary
											style={{
												fontSize: "0.875rem",
												fontWeight: "600",
												color: "hsl(var(--foreground))",
												cursor: "pointer",
												userSelect: "none",
											}}
										>
											Stack Trace
										</summary>
										<pre
											style={{
												marginTop: "0.5rem",
												fontSize: "0.75rem",
												color: "hsl(var(--muted-foreground))",
												fontFamily: "monospace",
												whiteSpace: "pre-wrap",
												wordBreak: "break-word",
												overflow: "auto",
												maxHeight: "12rem",
											}}
										>
											{error.stack}
										</pre>
									</details>
								)}

								{errorInfo.componentStack && (
									<details style={{ marginTop: "0.75rem" }}>
										<summary
											style={{
												fontSize: "0.875rem",
												fontWeight: "600",
												color: "hsl(var(--foreground))",
												cursor: "pointer",
												userSelect: "none",
											}}
										>
											Component Stack
										</summary>
										<pre
											style={{
												marginTop: "0.5rem",
												fontSize: "0.75rem",
												color: "hsl(var(--muted-foreground))",
												fontFamily: "monospace",
												whiteSpace: "pre-wrap",
												wordBreak: "break-word",
												overflow: "auto",
												maxHeight: "12rem",
											}}
										>
											{errorInfo.componentStack}
										</pre>
									</details>
								)}
							</div>
						)}

						<div
							style={{
								display: "flex",
								gap: "0.75rem",
								flexWrap: "wrap",
							}}
						>
							<button
								type="button"
								onClick={this.resetErrorBoundary}
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "0.5rem",
									whiteSpace: "nowrap",
									borderRadius: "0.375rem",
									fontWeight: "500",
									fontSize: "0.875rem",
									height: "2.25rem",
									padding: "0.5rem 1rem",
									backgroundColor: "hsl(var(--primary))",
									color: "hsl(var(--primary-foreground))",
									border: "none",
									cursor: "pointer",
									transition: "all 150ms",
									boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.opacity = "0.9";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.opacity = "1";
								}}
							>
								Try Again
							</button>
							<button
								type="button"
								onClick={this.handleGoHome}
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "0.5rem",
									whiteSpace: "nowrap",
									borderRadius: "0.375rem",
									fontWeight: "500",
									fontSize: "0.875rem",
									height: "2.25rem",
									padding: "0.5rem 1rem",
									backgroundColor: "hsl(var(--secondary))",
									color: "hsl(var(--secondary-foreground))",
									border: "none",
									cursor: "pointer",
									transition: "all 150ms",
									boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.opacity = "0.8";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.opacity = "1";
								}}
							>
								Go Home
							</button>
						</div>
					</div>
				</div>
			);
		}

		return children;
	}
}
