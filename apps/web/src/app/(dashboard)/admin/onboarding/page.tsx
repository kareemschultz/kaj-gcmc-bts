import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/admin/onboarding-wizard";
import { authClient } from "@/lib/auth-client";

export default async function AdminOnboardingPage() {
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
		<div className="min-h-screen bg-gray-50">
			<OnboardingWizard
				onComplete={() => {
					// Redirect to dashboard after completion
					window.location.href = "/dashboard";
				}}
			/>
		</div>
	);
}
