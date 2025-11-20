"use client";

import type {
	ClientBulkOperation,
	ClientExportOptions,
	ClientSearchFilter,
	ClientSearchParams,
	ExportFormat,
} from "@gcmc-kaj/types";
import {
	Calendar,
	Download,
	Filter,
	Search,
	SlidersHorizontal,
	X,
} from "lucide-react";
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
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ClientAdvancedSearchProps {
	clientId: number;
	onSearch?: (params: ClientSearchParams) => void;
	onExport?: (options: ClientExportOptions) => void;
	onBulkOperation?: (operation: ClientBulkOperation) => void;
	className?: string;
}

interface ActiveFilter {
	id: string;
	label: string;
	value: unknown;
	type: "text" | "select" | "date" | "range";
}

const PREDEFINED_FILTERS: ClientSearchFilter[] = [
	{
		id: "status",
		name: "status",
		type: "select",
		field: "status",
		label: "Status",
		options: ["active", "inactive", "suspended", "archived"],
		isActive: true,
		order: 1,
	},
	{
		id: "type",
		name: "type",
		type: "select",
		field: "type",
		label: "Client Type",
		options: ["individual", "company", "partnership"],
		isActive: true,
		order: 2,
	},
	{
		id: "sector",
		name: "sector",
		type: "text",
		field: "sector",
		label: "Sector",
		placeholder: "Enter sector...",
		isActive: true,
		order: 3,
	},
	{
		id: "riskLevel",
		name: "riskLevel",
		type: "select",
		field: "riskLevel",
		label: "Risk Level",
		options: ["low", "medium", "high"],
		isActive: true,
		order: 4,
	},
	{
		id: "complianceScore",
		name: "complianceScore",
		type: "number_range",
		field: "complianceScore",
		label: "Compliance Score",
		isActive: true,
		order: 5,
	},
	{
		id: "createdDate",
		name: "createdDate",
		type: "date_range",
		field: "createdAt",
		label: "Created Date",
		isActive: true,
		order: 6,
	},
	{
		id: "lastActivity",
		name: "lastActivity",
		type: "date_range",
		field: "lastActivity",
		label: "Last Activity",
		isActive: true,
		order: 7,
	},
];

export function ClientAdvancedSearch({
	clientId,
	onSearch,
	onExport,
	onBulkOperation,
	className,
}: ClientAdvancedSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [showExportDialog, setShowExportDialog] = useState(false);
	const [exportOptions, setExportOptions] = useState<ClientExportOptions>({
		format: "pdf",
		includeHistory: true,
		includeDocuments: false,
		includeCommunications: true,
		includeAnalytics: true,
	});

	const handleAddFilter = (filter: ClientSearchFilter, value: unknown) => {
		const existingFilterIndex = activeFilters.findIndex(
			(f) => f.id === filter.id,
		);
		const newFilter: ActiveFilter = {
			id: filter.id,
			label: filter.label,
			value,
			type: filter.type as ActiveFilter["type"],
		};

		if (existingFilterIndex >= 0) {
			const newFilters = [...activeFilters];
			newFilters[existingFilterIndex] = newFilter;
			setActiveFilters(newFilters);
		} else {
			setActiveFilters([...activeFilters, newFilter]);
		}
	};

	const handleRemoveFilter = (filterId: string) => {
		setActiveFilters(activeFilters.filter((f) => f.id !== filterId));
	};

	const handleClearAllFilters = () => {
		setActiveFilters([]);
		setSearchQuery("");
	};

	const handleSearch = () => {
		if (!onSearch) return;

		const filters: Record<string, unknown> = {};
		activeFilters.forEach((filter) => {
			filters[filter.id] = filter.value;
		});

		const searchParams: ClientSearchParams = {
			query: searchQuery || undefined,
			filters: Object.keys(filters).length > 0 ? filters : undefined,
			sort: "name",
			order: "asc",
			page: 1,
			limit: 50,
		};

		onSearch(searchParams);
	};

	const handleExport = () => {
		if (!onExport) return;
		onExport(exportOptions);
		setShowExportDialog(false);
	};

	const renderFilterInput = (filter: ClientSearchFilter) => {
		const existingFilter = activeFilters.find((f) => f.id === filter.id);

		switch (filter.type) {
			case "text":
				return (
					<Input
						placeholder={
							filter.placeholder || `Enter ${filter.label.toLowerCase()}...`
						}
						value={(existingFilter?.value as string) || ""}
						onChange={(e) => handleAddFilter(filter, e.target.value)}
					/>
				);

			case "select":
				return (
					<Select
						value={(existingFilter?.value as string) || ""}
						onValueChange={(value) => handleAddFilter(filter, value)}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={`Select ${filter.label.toLowerCase()}`}
							/>
						</SelectTrigger>
						<SelectContent>
							{filter.options?.map((option) => (
								<SelectItem key={option} value={option}>
									{option.charAt(0).toUpperCase() + option.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);

			case "number_range": {
				const rangeValue =
					(existingFilter?.value as { min?: number; max?: number }) || {};
				return (
					<div className="grid grid-cols-2 gap-2">
						<Input
							type="number"
							placeholder="Min"
							value={rangeValue.min || ""}
							onChange={(e) =>
								handleAddFilter(filter, {
									...rangeValue,
									min: e.target.value ? Number(e.target.value) : undefined,
								})
							}
						/>
						<Input
							type="number"
							placeholder="Max"
							value={rangeValue.max || ""}
							onChange={(e) =>
								handleAddFilter(filter, {
									...rangeValue,
									max: e.target.value ? Number(e.target.value) : undefined,
								})
							}
						/>
					</div>
				);
			}

			case "date_range": {
				const dateValue =
					(existingFilter?.value as { start?: string; end?: string }) || {};
				return (
					<div className="grid grid-cols-2 gap-2">
						<Input
							type="date"
							placeholder="Start date"
							value={dateValue.start || ""}
							onChange={(e) =>
								handleAddFilter(filter, {
									...dateValue,
									start: e.target.value,
								})
							}
						/>
						<Input
							type="date"
							placeholder="End date"
							value={dateValue.end || ""}
							onChange={(e) =>
								handleAddFilter(filter, {
									...dateValue,
									end: e.target.value,
								})
							}
						/>
					</div>
				);
			}

			default:
				return null;
		}
	};

	const formatFilterValue = (filter: ActiveFilter): string => {
		switch (filter.type) {
			case "text":
			case "select":
				return String(filter.value);
			case "range": {
				const range = filter.value as { min?: number; max?: number };
				return `${range.min || "0"} - ${range.max || "∞"}`;
			}
			case "date": {
				const dateRange = filter.value as { start?: string; end?: string };
				return `${dateRange.start || "Start"} to ${dateRange.end || "End"}`;
			}
			default:
				return String(filter.value);
		}
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Main Search Bar */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center space-x-4">
						<div className="relative flex-1">
							<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search across all client data..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							/>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsFiltersOpen(!isFiltersOpen)}
						>
							<SlidersHorizontal className="mr-2 h-4 w-4" />
							Filters
							{activeFilters.length > 0 && (
								<Badge variant="secondary" className="ml-2">
									{activeFilters.length}
								</Badge>
							)}
						</Button>
						<Button onClick={handleSearch}>
							<Search className="mr-2 h-4 w-4" />
							Search
						</Button>
					</div>

					{/* Active Filters */}
					{activeFilters.length > 0 && (
						<div className="mt-4 space-y-2">
							<div className="flex items-center justify-between">
								<Label className="font-medium text-sm">Active Filters:</Label>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClearAllFilters}
									className="h-auto p-1 text-xs"
								>
									Clear All
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{activeFilters.map((filter) => (
									<Badge
										key={filter.id}
										variant="secondary"
										className="flex items-center gap-2 pr-1"
									>
										<span>
											{filter.label}: {formatFilterValue(filter)}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
											onClick={() => handleRemoveFilter(filter.id)}
										>
											<X className="h-3 w-3" />
										</Button>
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Advanced Filters Panel */}
			<Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
				<CollapsibleContent>
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Advanced Filters</CardTitle>
							<CardDescription>
								Refine your search with specific criteria
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{PREDEFINED_FILTERS.map((filter) => (
									<div key={filter.id} className="space-y-2">
										<Label htmlFor={filter.id}>{filter.label}</Label>
										{renderFilterInput(filter)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</CollapsibleContent>
			</Collapsible>

			{/* Export and Bulk Operations */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Label className="font-medium text-sm">Actions:</Label>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										Bulk Operations
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											onBulkOperation?.({
												type: "update",
												clientIds: [clientId],
												params: { status: "active" },
											})
										}
									>
										Update Status
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											onBulkOperation?.({
												type: "tag",
												clientIds: [clientId],
												params: { tags: ["bulk-update"] },
											})
										}
									>
										Add Tags
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											onBulkOperation?.({
												type: "archive",
												clientIds: [clientId],
											})
										}
									>
										Archive Clients
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
							<DialogTrigger asChild>
								<Button variant="outline" size="sm">
									<Download className="mr-2 h-4 w-4" />
									Export
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Export Client Data</DialogTitle>
									<DialogDescription>
										Configure export options for client information
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Export Format</Label>
										<Select
											value={exportOptions.format}
											onValueChange={(value) =>
												setExportOptions({
													...exportOptions,
													format: value as ExportFormat,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="pdf">PDF Report</SelectItem>
												<SelectItem value="excel">Excel Spreadsheet</SelectItem>
												<SelectItem value="csv">CSV File</SelectItem>
												<SelectItem value="json">JSON Data</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<Separator />

									<div className="space-y-3">
										<Label>Include Sections</Label>
										<div className="space-y-2">
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={exportOptions.includeHistory}
													onChange={(e) =>
														setExportOptions({
															...exportOptions,
															includeHistory: e.target.checked,
														})
													}
												/>
												<span className="text-sm">Activity History</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={exportOptions.includeDocuments}
													onChange={(e) =>
														setExportOptions({
															...exportOptions,
															includeDocuments: e.target.checked,
														})
													}
												/>
												<span className="text-sm">Document Metadata</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={exportOptions.includeCommunications}
													onChange={(e) =>
														setExportOptions({
															...exportOptions,
															includeCommunications: e.target.checked,
														})
													}
												/>
												<span className="text-sm">Communications Log</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={exportOptions.includeAnalytics}
													onChange={(e) =>
														setExportOptions({
															...exportOptions,
															includeAnalytics: e.target.checked,
														})
													}
												/>
												<span className="text-sm">Analytics & Metrics</span>
											</label>
										</div>
									</div>

									<div className="flex justify-end space-x-2">
										<Button
											variant="outline"
											onClick={() => setShowExportDialog(false)}
										>
											Cancel
										</Button>
										<Button onClick={handleExport}>
											<Download className="mr-2 h-4 w-4" />
											Export
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
