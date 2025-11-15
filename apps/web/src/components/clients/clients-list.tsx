"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const CLIENT_SKELETON_ITEMS = Array.from(
	{ length: 6 },
	(_, index) => `client-skeleton-${index}`,
);

export function ClientsList() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	const { data, isLoading, error } = trpc.clients.list.useQuery({
		search,
		page,
		pageSize: 20,
	});

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading clients: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search clients..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<Link href="/clients/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Client
					</Button>
				</Link>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{CLIENT_SKELETON_ITEMS.map((skeletonKey) => (
						<Card key={skeletonKey}>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="mb-2 h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{data?.clients.map((client: (typeof data.clients)[number]) => (
							<Link key={client.id} href={`/clients/${client.id}`}>
								<Card className="cursor-pointer transition-shadow hover:shadow-lg">
									<CardHeader>
										<CardTitle className="text-lg">{client.name}</CardTitle>
										<CardDescription className="capitalize">
											{client.type}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-1 text-sm">
											{client.email && (
												<p className="text-muted-foreground">{client.email}</p>
											)}
											{client.sector && (
												<p className="text-muted-foreground">
													Sector: {client.sector}
												</p>
											)}
											<div className="mt-3 flex gap-4 text-muted-foreground text-xs">
												<span>{client._count.documents} docs</span>
												<span>{client._count.filings} filings</span>
												<span>{client._count.serviceRequests} services</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>

					{data && data.pagination.totalPages > 1 && (
						<div className="mt-6 flex justify-center gap-2">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {data.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
