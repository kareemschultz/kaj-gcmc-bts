"use client";

import React from "react";
import Script from "next/script";
import { CSPNonceProps } from "@/hooks/use-csp-nonce";

/**
 * Secure Script Component
 *
 * A wrapper around Next.js Script component that ensures CSP compliance
 * by using nonce-based authentication for inline scripts.
 *
 * Security Features:
 * - Nonce-based CSP compliance
 * - XSS prevention through controlled script execution
 * - Support for both inline and external scripts
 *
 * Usage:
 * <SecureScript nonce={nonce} strategy="beforeInteractive">
 *   {`console.log('Secure inline script');`}
 * </SecureScript>
 */

interface SecureScriptProps extends CSPNonceProps {
	children?: string;
	src?: string;
	strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload";
	onLoad?: () => void;
	onReady?: () => void;
	onError?: () => void;
	id?: string;
}

export function SecureScript({
	nonce,
	children,
	src,
	strategy = "afterInteractive",
	onLoad,
	onReady,
	onError,
	id,
}: SecureScriptProps) {
	// If we have a nonce, use it for inline scripts
	const scriptProps = {
		...(nonce && { nonce }),
		...(id && { id }),
		...(onLoad && { onLoad }),
		...(onReady && { onReady }),
		...(onError && { onError }),
	};

	// External script
	if (src) {
		return (
			<Script src={src} strategy={strategy} {...scriptProps}>
				{children}
			</Script>
		);
	}

	// Inline script
	return (
		<Script strategy={strategy} {...scriptProps}>
			{children}
		</Script>
	);
}

/**
 * Secure Style Component
 *
 * A component for CSP-compliant inline styles with nonce support
 */
interface SecureStyleProps extends CSPNonceProps {
	children: string;
	id?: string;
}

export function SecureStyle({ nonce, children, id }: SecureStyleProps) {
	const styleProps = {
		...(nonce && { nonce }),
		...(id && { id }),
		dangerouslySetInnerHTML: { __html: children },
	};

	return <style {...styleProps} />;
}

/**
 * CSP Debug Component
 *
 * Displays CSP configuration information in development mode
 */
export function CSPDebugInfo({ nonce }: CSPNonceProps) {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	return (
		<div
			style={{
				position: "fixed",
				bottom: "10px",
				right: "10px",
				background: "rgba(0, 0, 0, 0.8)",
				color: "white",
				padding: "8px 12px",
				borderRadius: "4px",
				fontSize: "12px",
				fontFamily: "monospace",
				zIndex: 9999,
			}}
		>
			CSP Nonce: {nonce ? `${nonce.substring(0, 8)}...` : "None"}
		</div>
	);
}