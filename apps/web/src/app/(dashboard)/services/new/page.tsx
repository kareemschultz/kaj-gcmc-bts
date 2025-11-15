import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ServiceForm } from "@/components/services/service-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default async function NewServicePage() {
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
			<div className="mb-6">
				<Link href="/services">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Services
					</Button>
				</Link>
			</div>

			<Card className="mx-auto max-w-3xl">
				<CardHeader>
					<CardTitle className="text-2xl">Create New Service</CardTitle>
				</CardHeader>
				<CardContent>
					<ServiceForm />
				</CardContent>
			</Card>
		</div>
	);
}
