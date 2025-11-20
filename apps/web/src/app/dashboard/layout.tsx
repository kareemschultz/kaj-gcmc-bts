import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// TEMPORARILY: Using client-side authentication check instead of server-side
	// This bypasses the SSR session issue while we fix the auth client configuration

	return (
		<AuthGuard requireAuth={true}>
			<div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
				{/* Main Content */}
				<main className="flex-1 overflow-y-auto">
					<div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
						{children}
					</div>
				</main>
			</div>
		</AuthGuard>
	);
}