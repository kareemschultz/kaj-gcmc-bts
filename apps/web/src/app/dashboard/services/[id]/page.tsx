import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ServiceDetail } from "@/components/services/service-detail";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default async function ServiceDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	const serviceId = Number.parseInt(id, 10);

	if (Number.isNaN(serviceId)) {
		redirect("/services");
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
			<ServiceDetail serviceId={serviceId} />
		</div>
	);
}
