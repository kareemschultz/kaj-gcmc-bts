import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ServiceRequestDetail } from "@/components/service-requests/service-request-detail";
import { authClient } from "@/lib/auth-client";

interface ServiceRequestDetailPageProps {
	params: {
		id: string;
	};
}

export default async function ServiceRequestDetailPage({
	params,
}: ServiceRequestDetailPageProps) {
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
			<ServiceRequestDetail
				serviceRequestId={Number.parseInt(params.id, 10)}
			/>
		</div>
	);
}
