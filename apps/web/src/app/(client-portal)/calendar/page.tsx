import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientCalendar } from "@/components/client-portal/client-calendar";
import { authClient } from "@/lib/auth-client";

export default async function ClientCalendarPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientCalendar user={session.user} />;
}