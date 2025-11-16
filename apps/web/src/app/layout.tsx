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
	title: "GCMC-KAJ - Compliance Management Platform",
	description:
		"Enterprise-grade compliance and document management platform for regulatory authorities",
	viewport: "width=device-width, initial-scale=1, maximum-scale=5",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
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
