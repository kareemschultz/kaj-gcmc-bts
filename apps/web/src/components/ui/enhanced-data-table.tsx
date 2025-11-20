import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	Edit,
	Eye,
	Filter,
	MoreHorizontal,
	Search,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { brandColors } from "@/styles/brand";

interface Column<T = any> {
	key: string;
	label: string;
	sortable?: boolean;
	filterable?: boolean;
	render?: (value: any, row: T) => React.ReactNode;
	className?: string;
	align?: "left" | "center" | "right";
	width?: string | number;
}

interface TableAction<T = any> {
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	onClick: (row: T) => void;
	variant?: "default" | "danger" | "warning";
	disabled?: (row: T) => boolean;
}

interface EnhancedDataTableProps<T = any> {
	data: T[];
	columns: Column<T>[];
	actions?: TableAction<T>[];
	searchable?: boolean;
	filterable?: boolean;
	pagination?: boolean;
	pageSize?: number;
	loading?: boolean;
	emptyMessage?: string;
	className?: string;
	onRowClick?: (row: T) => void;
	selectable?: boolean;
	onSelectionChange?: (selectedRows: T[]) => void;
}

type SortDirection = "asc" | "desc" | null;

export function EnhancedDataTable<T extends Record<string, any>>({
	data,
	columns,
	actions = [],
	searchable = true,
	filterable = true,
	pagination = true,
	pageSize = 10,
	loading = false,
	emptyMessage = "No data available",
	className,
	onRowClick,
	selectable = false,
	onSelectionChange,
}: EnhancedDataTableProps<T>) {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: SortDirection;
	}>({ key: "", direction: null });
	const [filters, setFilters] = useState<Record<string, string>>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedRows, setSelectedRows] = useState<T[]>([]);
	const [showFilters, setShowFilters] = useState(false);

	// Filter and search data
	const filteredData = useMemo(() => {
		return data.filter((row) => {
			// Search filter
			if (searchTerm) {
				const searchMatch = Object.values(row).some((value) =>
					String(value).toLowerCase().includes(searchTerm.toLowerCase()),
				);
				if (!searchMatch) return false;
			}

			// Column filters
			for (const [columnKey, filterValue] of Object.entries(filters)) {
				if (
					filterValue &&
					!String(row[columnKey])
						.toLowerCase()
						.includes(filterValue.toLowerCase())
				) {
					return false;
				}
			}

			return true;
		});
	}, [data, searchTerm, filters]);

	// Sort data
	const sortedData = useMemo(() => {
		if (!sortConfig.key || !sortConfig.direction) {
			return filteredData;
		}

		return [...filteredData].sort((a, b) => {
			const aValue = a[sortConfig.key];
			const bValue = b[sortConfig.key];

			if (aValue === bValue) return 0;

			const isAscending = sortConfig.direction === "asc";
			if (aValue < bValue) return isAscending ? -1 : 1;
			return isAscending ? 1 : -1;
		});
	}, [filteredData, sortConfig]);

	// Paginate data
	const paginatedData = useMemo(() => {
		if (!pagination) return sortedData;

		const startIndex = (currentPage - 1) * pageSize;
		return sortedData.slice(startIndex, startIndex + pageSize);
	}, [sortedData, currentPage, pageSize, pagination]);

	const totalPages = Math.ceil(sortedData.length / pageSize);

	const handleSort = (columnKey: string) => {
		setSortConfig((prev) => {
			if (prev.key !== columnKey) {
				return { key: columnKey, direction: "asc" };
			}
			if (prev.direction === "asc") {
				return { key: columnKey, direction: "desc" };
			}
			if (prev.direction === "desc") {
				return { key: "", direction: null };
			}
			return { key: columnKey, direction: "asc" };
		});
	};

	const handleFilter = (columnKey: string, value: string) => {
		setFilters((prev) => ({
			...prev,
			[columnKey]: value,
		}));
		setCurrentPage(1);
	};

	const handleRowSelect = (row: T, checked: boolean) => {
		const newSelection = checked
			? [...selectedRows, row]
			: selectedRows.filter((r) => r !== row);

		setSelectedRows(newSelection);
		onSelectionChange?.(newSelection);
	};

	const handleSelectAll = (checked: boolean) => {
		const newSelection = checked ? paginatedData : [];
		setSelectedRows(newSelection);
		onSelectionChange?.(newSelection);
	};

	const getSortIcon = (columnKey: string) => {
		if (sortConfig.key !== columnKey) {
			return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="h-4 w-4 text-primary" />
		) : (
			<ArrowDown className="h-4 w-4 text-primary" />
		);
	};

	const getActionVariantClass = (variant = "default") => {
		switch (variant) {
			case "danger":
				return "text-red-600 hover:text-red-700";
			case "warning":
				return "text-orange-600 hover:text-orange-700";
			default:
				return "text-gray-600 hover:text-gray-700";
		}
	};

	if (loading) {
		return (
			<div className="rounded-lg border bg-white p-8 shadow-sm">
				<div className="animate-pulse space-y-4">
					{/* Header skeleton */}
					<div className="flex items-center justify-between">
						<div className="h-8 w-64 rounded bg-gray-200" />
						<div className="h-8 w-32 rounded bg-gray-200" />
					</div>
					{/* Table skeleton */}
					<div className="space-y-3">
						<div className="h-10 rounded bg-gray-200" />
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="h-12 rounded bg-gray-100" />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("rounded-lg border bg-white shadow-sm", className)}>
			{/* Header with search and filters */}
			{(searchable || filterable) && (
				<div className="border-gray-200 border-b p-6">
					<div className="flex items-center justify-between gap-4">
						{searchable && (
							<div className="relative max-w-md flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
								<input
									type="text"
									placeholder="Search..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						)}

						<div className="flex items-center gap-2">
							{filterable && (
								<motion.button
									onClick={() => setShowFilters(!showFilters)}
									className={cn(
										"flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
										showFilters
											? "border-primary bg-primary/5 text-primary"
											: "border-gray-300 text-gray-600 hover:border-gray-400",
									)}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<Filter className="h-4 w-4" />
									Filters
								</motion.button>
							)}

							{selectedRows.length > 0 && (
								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									className="flex items-center gap-2 text-gray-600 text-sm"
								>
									<span>{selectedRows.length} selected</span>
									<button className="text-primary hover:text-primary/80">
										Export Selected
									</button>
								</motion.div>
							)}
						</div>
					</div>

					{/* Filter inputs */}
					<AnimatePresence>
						{showFilters && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4"
							>
								{columns
									.filter((col) => col.filterable)
									.map((column) => (
										<div key={column.key}>
											<label className="mb-1 block font-medium text-gray-700 text-sm">
												{column.label}
											</label>
											<input
												type="text"
												placeholder={`Filter by ${column.label.toLowerCase()}`}
												value={filters[column.key] || ""}
												onChange={(e) =>
													handleFilter(column.key, e.target.value)
												}
												className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
											/>
										</div>
									))}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			)}

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							{selectable && (
								<th className="px-6 py-3 text-left">
									<input
										type="checkbox"
										checked={
											paginatedData.length > 0 &&
											selectedRows.length === paginatedData.length
										}
										onChange={(e) => handleSelectAll(e.target.checked)}
										className="rounded border-gray-300 text-primary focus:ring-primary"
									/>
								</th>
							)}
							{columns.map((column) => (
								<th
									key={column.key}
									className={cn(
										"px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider",
										column.className,
										column.sortable && "cursor-pointer hover:bg-gray-100",
										column.align === "center" && "text-center",
										column.align === "right" && "text-right",
									)}
									style={{ width: column.width }}
									onClick={() => column.sortable && handleSort(column.key)}
								>
									<div className="flex items-center gap-1">
										<span>{column.label}</span>
										{column.sortable && getSortIcon(column.key)}
									</div>
								</th>
							))}
							{actions.length > 0 && (
								<th className="px-6 py-3 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white">
						<AnimatePresence>
							{paginatedData.map((row, index) => (
								<motion.tr
									key={index}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ delay: index * 0.05, duration: 0.3 }}
									className={cn(
										"transition-colors hover:bg-gray-50",
										onRowClick && "cursor-pointer",
										selectedRows.includes(row) && "bg-primary/5",
									)}
									onClick={() => onRowClick?.(row)}
								>
									{selectable && (
										<td className="whitespace-nowrap px-6 py-4">
											<input
												type="checkbox"
												checked={selectedRows.includes(row)}
												onChange={(e) => handleRowSelect(row, e.target.checked)}
												className="rounded border-gray-300 text-primary focus:ring-primary"
												onClick={(e) => e.stopPropagation()}
											/>
										</td>
									)}
									{columns.map((column) => (
										<td
											key={column.key}
											className={cn(
												"whitespace-nowrap px-6 py-4 text-gray-900 text-sm",
												column.className,
												column.align === "center" && "text-center",
												column.align === "right" && "text-right",
											)}
										>
											{column.render
												? column.render(row[column.key], row)
												: row[column.key]}
										</td>
									))}
									{actions.length > 0 && (
										<td className="whitespace-nowrap px-6 py-4 text-right font-medium text-sm">
											<div className="flex items-center justify-end gap-2">
												{actions.map((action, actionIndex) => (
													<motion.button
														key={actionIndex}
														onClick={(e) => {
															e.stopPropagation();
															action.onClick(row);
														}}
														disabled={action.disabled?.(row)}
														className={cn(
															"rounded p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
															getActionVariantClass(action.variant),
														)}
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.95 }}
														title={action.label}
													>
														{action.icon ? (
															<action.icon className="h-4 w-4" />
														) : (
															<MoreHorizontal className="h-4 w-4" />
														)}
													</motion.button>
												))}
											</div>
										</td>
									)}
								</motion.tr>
							))}
						</AnimatePresence>
					</tbody>
				</table>

				{/* Empty state */}
				{paginatedData.length === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="py-12 text-center"
					>
						<div className="mb-4 text-gray-400">
							<Search className="mx-auto h-12 w-12" />
						</div>
						<p className="font-medium text-gray-500 text-lg">{emptyMessage}</p>
						<p className="mt-1 text-gray-400 text-sm">
							{searchTerm || Object.values(filters).some((f) => f)
								? "Try adjusting your search or filters"
								: "No data to display"}
						</p>
					</motion.div>
				)}
			</div>

			{/* Pagination */}
			{pagination && totalPages > 1 && (
				<div className="border-gray-200 border-t px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="text-gray-500 text-sm">
							Showing {(currentPage - 1) * pageSize + 1} to{" "}
							{Math.min(currentPage * pageSize, sortedData.length)} of{" "}
							{sortedData.length} results
						</div>

						<div className="flex items-center gap-2">
							<motion.button
								onClick={() => setCurrentPage(1)}
								disabled={currentPage === 1}
								className="rounded border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<ChevronsLeft className="h-4 w-4" />
							</motion.button>
							<motion.button
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="rounded border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<ChevronLeft className="h-4 w-4" />
							</motion.button>

							<div className="flex items-center gap-1">
								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
									let pageNumber;
									if (totalPages <= 5) {
										pageNumber = i + 1;
									} else if (currentPage <= 3) {
										pageNumber = i + 1;
									} else if (currentPage >= totalPages - 2) {
										pageNumber = totalPages - 4 + i;
									} else {
										pageNumber = currentPage - 2 + i;
									}

									return (
										<motion.button
											key={pageNumber}
											onClick={() => setCurrentPage(pageNumber)}
											className={cn(
												"h-8 w-8 rounded border font-medium text-sm",
												pageNumber === currentPage
													? "border-primary bg-primary text-white"
													: "border-gray-300 text-gray-700 hover:bg-gray-50",
											)}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
										>
											{pageNumber}
										</motion.button>
									);
								})}
							</div>

							<motion.button
								onClick={() =>
									setCurrentPage((prev) => Math.min(totalPages, prev + 1))
								}
								disabled={currentPage === totalPages}
								className="rounded border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<ChevronRight className="h-4 w-4" />
							</motion.button>
							<motion.button
								onClick={() => setCurrentPage(totalPages)}
								disabled={currentPage === totalPages}
								className="rounded border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<ChevronsRight className="h-4 w-4" />
							</motion.button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
