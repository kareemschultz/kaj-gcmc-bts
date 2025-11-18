"use client";

import { ErrorBoundary } from "@GCMC-KAJ/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";
import { CommandPalette, useCommandPalette } from "./ui/command-palette";
import { Toaster } from "./ui/sonner";

function ProvidersWithCommandPalette({
	children,
}: {
	children: React.ReactNode;
}) {
	const { open, setOpen } = useCommandPalette();

	return (
		<>
			{children}
			<CommandPalette open={open} setOpen={setOpen} />
		</>
	);
}

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ErrorBoundary>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<QueryClientProvider client={queryClient}>
						<ProvidersWithCommandPalette>
							{children}
						</ProvidersWithCommandPalette>
						<ReactQueryDevtools />
					</QueryClientProvider>
					<Toaster richColors />
				</ThemeProvider>
			</trpc.Provider>
		</ErrorBoundary>
	);
}
