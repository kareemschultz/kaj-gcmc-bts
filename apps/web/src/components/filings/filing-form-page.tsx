"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilingForm } from "./filing-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function FilingFormPage() {
	const router = useRouter();
	const [formOpen, setFormOpen] = useState(true);

	return (
		<div>
			<Link href="/filings">
				<Button variant="ghost" size="sm" className="mb-4">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Filings
				</Button>
			</Link>
			<h1 className="text-3xl font-bold mb-6">Create New Filing</h1>
			<FilingForm
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) {
						router.push("/filings");
					}
				}}
				onSuccess={() => {
					router.push("/filings");
				}}
			/>
		</div>
	);
}
