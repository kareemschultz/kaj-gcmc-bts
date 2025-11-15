"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilingForm } from "./filing-form";

export function FilingFormPage() {
	const router = useRouter();
	const [formOpen, setFormOpen] = useState(true);

	return (
		<div>
			<Link href="/filings">
				<Button variant="ghost" size="sm" className="mb-4">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Filings
				</Button>
			</Link>
			<h1 className="mb-6 font-bold text-3xl">Create New Filing</h1>
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
