import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientPortalHeader } from "@/components/client-portal/client-portal-header";
import { ClientPortalNav } from "@/components/client-portal/client-portal-nav";
import { authClient } from "@/lib/auth-client";

export default async function ClientPortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	// Check if user has client role/permissions
	const userRole = session.user.role || "client";
	if (userRole !== "client" && userRole !== "admin") {
		// If not a client or admin, redirect to main dashboard
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			{/* Sidebar Navigation */}
			<div className="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0">
				<ClientPortalNav />
			</div>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col lg:pl-64">
				{/* Header */}
				<ClientPortalHeader user={session.user} />

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto">
					<div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
