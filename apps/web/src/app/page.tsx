import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default async function HomePage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	// If user is authenticated, redirect based on role
	if (session?.user) {
		const userRole = session.user.role || "client";
		if (userRole === "client") {
			redirect("/client-portal");
		} else {
			redirect("/dashboard");
		}
	}

	// If not authenticated, redirect to login
	redirect("/login");
}
