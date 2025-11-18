"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	Search,
	Settings2,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchKey?: string;
	searchPlaceholder?: string;
	enableExport?: boolean;
	enableColumnVisibility?: boolean;
	enableRowSelection?: boolean;
	enablePagination?: boolean;
	pageSize?: number;
	onExport?: (data: TData[]) => void;
	onRowSelectionChange?: (selectedRows: TData[]) => void;
	className?: string;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchPlaceholder = "Search...",
	enableExport = true,
	enableColumnVisibility = true,
	enableRowSelection = false,
	enablePagination = true,
	pageSize = 10,
	onExport,
	onRowSelectionChange,
	className,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	// Add selection column if row selection is enabled
	const tableColumns = React.useMemo(() => {
		if (!enableRowSelection) return columns;

		const selectionColumn: ColumnDef<TData, TValue> = {
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		};

		return [selectionColumn, ...columns];
	}, [columns, enableRowSelection]);

	const table = useReactTable({
		data,
		columns: tableColumns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: enablePagination
			? getPaginationRowModel()
			: undefined,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize,
			},
		},
	});

	// Handle row selection changes
	React.useEffect(() => {
		if (onRowSelectionChange && enableRowSelection) {
			const selectedRows = table
				.getFilteredSelectedRowModel()
				.rows.map((row) => row.original);
			onRowSelectionChange(selectedRows);
		}
	}, [table, onRowSelectionChange, enableRowSelection]);

	// Export functionality
	const handleExport = React.useCallback(() => {
		if (onExport) {
			const exportData =
				enableRowSelection && Object.keys(rowSelection).length > 0
					? table.getFilteredSelectedRowModel().rows.map((row) => row.original)
					: table.getFilteredRowModel().rows.map((row) => row.original);
			onExport(exportData);
		}
	}, [table, onExport, enableRowSelection, rowSelection]);

	return (
		<div className={className}>
			{/* Toolbar */}
			<div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-2">
					{searchKey && (
						<div className="relative max-w-sm flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={searchPlaceholder}
								value={
									(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
								}
								onChange={(event) =>
									table.getColumn(searchKey)?.setFilterValue(event.target.value)
								}
								className="pl-9"
							/>
						</div>
					)}
					{enableRowSelection && (
						<div className="text-muted-foreground text-sm">
							{table.getFilteredSelectedRowModel().rows.length} of{" "}
							{table.getFilteredRowModel().rows.length} row(s) selected
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{enableExport && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleExport}
							disabled={data.length === 0}
						>
							<Download className="mr-2 h-4 w-4" />
							Export
						</Button>
					)}

					{enableColumnVisibility && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Settings2 className="mr-2 h-4 w-4" />
									View
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								{table
									.getAllColumns()
									.filter(
										(column) =>
											typeof column.accessorFn !== "undefined" &&
											column.getCanHide(),
									)
									.map((column) => {
										return (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value) =>
													column.toggleVisibility(!!value)
												}
											>
												{column.id}
											</DropdownMenuCheckboxItem>
										);
									})}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} className="whitespace-nowrap">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="whitespace-nowrap">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={tableColumns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{enablePagination && (
				<div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-muted-foreground text-sm">
						Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
						{Math.min(
							(table.getState().pagination.pageIndex + 1) * pageSize,
							table.getFilteredRowModel().rows.length,
						)}{" "}
						of {table.getFilteredRowModel().rows.length} entries
					</div>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<p className="text-muted-foreground text-sm">Rows per page</p>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger className="h-8 w-16">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronsLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<div className="flex min-w-[100px] items-center justify-center font-medium text-sm">
								Page {table.getState().pagination.pageIndex + 1} of{" "}
								{table.getPageCount()}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<ChevronsRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
