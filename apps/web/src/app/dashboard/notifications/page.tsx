import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { authClient } from "@/lib/auth-client";

export default async function NotificationsPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Notifications</h1>
					<p className="mt-2 text-muted-foreground">
						Manage and view all your notifications
					</p>
				</div>
			</div>
			<NotificationsList />
		</div>
	);
}
