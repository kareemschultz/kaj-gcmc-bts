import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

// Optimized font loading with next/font
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
	preload: true,
	fallback: [
		"system-ui",
		"-apple-system",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"sans-serif",
	],
});

export const metadata: Metadata = {
	title: "GCMC-KAJ Business Tax Services | Guyana Compliance Platform",
	description:
		"Professional business tax services and compliance management for Guyana enterprises. Streamline GRA, DCRA, NIS, and EPA compliance with our trusted platform.",
	keywords: [
		"Guyana tax services",
		"business compliance",
		"GRA filing",
		"DCRA registration",
		"NIS contributions",
		"EPA permits",
		"tax consulting Guyana",
		"business registration Guyana"
	].join(", "),
	viewport: "width=device-width, initial-scale=1, maximum-scale=5",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#3b82f6" },
		{ media: "(prefers-color-scheme: dark)", color: "#1e40af" },
	],
	robots: "index, follow",
	authors: [{ name: "GCMC-KAJ Business Tax Services" }],
	creator: "GCMC-KAJ Business Tax Services",
	publisher: "GCMC-KAJ Business Tax Services",
	openGraph: {
		type: "website",
		title: "GCMC-KAJ Business Tax Services | Your Trusted Partner in Guyana Business Compliance",
		description: "Simplifying Guyana business compliance with expert tax services, automated filing, and regulatory guidance. Trusted by enterprises across Guyana.",
		siteName: "GCMC-KAJ Compliance Hub",
		locale: "en_GY",
	},
	twitter: {
		card: "summary_large_image",
		title: "GCMC-KAJ Business Tax Services",
		description: "Your trusted partner for Guyana business compliance and tax services.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className={inter.variable}>
			<body className="font-sans antialiased">
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
