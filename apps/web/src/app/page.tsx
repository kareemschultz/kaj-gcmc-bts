import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default async function HomePage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	// If user is authenticated, redirect to dashboard
	if (session?.user) {
		redirect("/dashboard");
	}

	// If not authenticated, redirect to login
	redirect("/login");
}
