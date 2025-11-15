"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "./client-form";

export function ClientFormPage() {
	const router = useRouter();
	const [formOpen, setFormOpen] = useState(true);

	return (
		<div>
			<Link href="/clients">
				<Button variant="ghost" size="sm" className="mb-4">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Clients
				</Button>
			</Link>
			<h1 className="mb-6 font-bold text-3xl">Create New Client</h1>
			<ClientForm
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) {
						router.push("/clients");
					}
				}}
				onSuccess={() => {
					router.push("/clients");
				}}
			/>
		</div>
	);
}
