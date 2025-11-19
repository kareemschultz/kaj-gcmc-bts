import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign In - GCMC-KAJ Business Tax Services",
	description:
		"Sign in to your GCMC-KAJ Business Tax Services account to manage compliance, filings, and business services.",
	viewport: "width=device-width, initial-scale=1",
	themeColor: "#059669", // emerald-600
};

export default function LoginLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Clean layout without any navigation or headers for authentication pages
	return <div className="min-h-screen">{children}</div>;
}
