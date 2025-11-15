import type { Metadata } from "next";
import "../index.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
	title: "Client Portal - GCMC-KAJ",
	description: "Client Portal for GCMC-KAJ",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="font-sans antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
