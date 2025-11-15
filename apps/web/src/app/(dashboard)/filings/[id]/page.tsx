import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FilingDetail } from "@/components/filings/filing-detail";
import { authClient } from "@/lib/auth-client";

interface FilingDetailPageProps {
	params: {
		id: string;
	};
}

export default async function FilingDetailPage({
	params,
}: FilingDetailPageProps) {
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
			<FilingDetail filingId={Number.parseInt(params.id, 10)} />
		</div>
	);
}
