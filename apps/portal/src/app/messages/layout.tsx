"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PortalHeader from "@/components/portal-header";
import PortalNav from "@/components/portal-nav";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
	}, [session, isPending, router]);

	if (isPending) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="mt-2 text-muted-foreground text-sm">Loading...</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="flex min-h-screen flex-col">
			<PortalHeader />
			<PortalNav />
			<main className="flex-1 bg-gray-50 dark:bg-gray-900">{children}</main>
		</div>
	);
}
