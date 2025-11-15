"use client";

import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const SERVICE_SKELETON_ITEMS = Array.from(
	{ length: 6 },
	(_, index) => `service-skeleton-${index}`,
);

export function ServicesList() {
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
		undefined,
	);

	const {
		data: services,
		isLoading,
		error,
	} = trpc.services.list.useQuery({
		search,
		category: categoryFilter || undefined,
		active: activeFilter,
	});

	const { data: categories } = trpc.services.categories.useQuery();
	const { data: stats } = trpc.services.stats.useQuery();

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading services: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="pb-3">
							<CardDescription>Total Services</CardDescription>
							<CardTitle className="text-3xl">{stats.total}</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardDescription>Active Services</CardDescription>
							<CardTitle className="text-3xl">{stats.active}</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardDescription>Inactive Services</CardDescription>
							<CardTitle className="text-3xl">{stats.inactive}</CardTitle>
						</CardHeader>
					</Card>
				</div>
			)}

			{/* Search and Filters */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search services..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					<Select
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
						className="w-full md:w-[200px]"
					>
						<option value="">All Categories</option>
						{categories?.map((cat) => (
							<option key={cat.category} value={cat.category}>
								{cat.category} ({cat._count})
							</option>
						))}
					</Select>
					<Select
						value={
							activeFilter === undefined
								? ""
								: activeFilter
									? "active"
									: "inactive"
						}
						onChange={(e) =>
							setActiveFilter(
								e.target.value === "" ? undefined : e.target.value === "active",
							)
						}
						className="w-full md:w-[150px]"
					>
						<option value="">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</Select>
					<Link href="/services/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Service
						</Button>
					</Link>
				</div>
			</div>

			{/* Services Grid */}
			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{SERVICE_SKELETON_ITEMS.map((skeletonKey) => (
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
			) : services && services.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{services.map((service) => (
						<Link key={service.id} href={`/services/${service.id}`}>
							<Card className="cursor-pointer transition-shadow hover:shadow-lg">
								<CardHeader>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg">{service.name}</CardTitle>
										<Badge variant={service.active ? "default" : "secondary"}>
											{service.active ? "Active" : "Inactive"}
										</Badge>
									</div>
									<CardDescription className="capitalize">
										{service.category}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{service.description && (
											<p className="line-clamp-2 text-muted-foreground text-sm">
												{service.description}
											</p>
										)}
										<div className="flex flex-wrap gap-3 pt-2">
											{service.basePrice !== null && (
												<div className="text-sm">
													<span className="text-muted-foreground">Price: </span>
													<span className="font-semibold">
														${service.basePrice.toFixed(2)}
													</span>
												</div>
											)}
											{service.estimatedDays !== null && (
												<div className="text-sm">
													<span className="text-muted-foreground">Est: </span>
													<span className="font-semibold">
														{service.estimatedDays} days
													</span>
												</div>
											)}
										</div>
										<div className="flex gap-4 border-t pt-3 text-muted-foreground text-xs">
											<span>{service._count.serviceRequests} requests</span>
											<span>{service._count.templates} templates</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Filter className="mb-4 h-12 w-12 text-muted-foreground" />
						<p className="text-lg text-muted-foreground">No services found</p>
						<p className="mt-2 text-muted-foreground text-sm">
							Try adjusting your search or filters, or create a new service.
						</p>
						<Link href="/services/new" className="mt-4">
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Create Service
							</Button>
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
