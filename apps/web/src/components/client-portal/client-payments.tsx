"use client";

import {
	Calendar,
	CreditCard,
	DollarSign,
	Download,
	Eye,
	Filter,
	MoreHorizontal,
	Plus,
	Search,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import {
	Bar,
	BarChart,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface Invoice {
	id: string;
	invoiceNumber: string;
	description: string;
	amount: number;
	tax: number;
	total: number;
	status: "paid" | "pending" | "overdue" | "draft";
	issueDate: string;
	dueDate: string;
	paidDate?: string;
	paymentMethod?: string;
	category: string;
}

interface PaymentMethod {
	id: string;
	type: "credit_card" | "bank_account" | "wallet";
	name: string;
	last4?: string;
	expiryDate?: string;
	isDefault: boolean;
}

interface ClientPaymentsProps {
	user: User;
}

// Mock data
const mockInvoices: Invoice[] = [
	{
		id: "1",
		invoiceNumber: "INV-2024-001",
		description: "Q4 Tax Filing Services",
		amount: 2500,
		tax: 375,
		total: 2875,
		status: "pending",
		issueDate: "2024-11-15",
		dueDate: "2024-12-15",
		category: "Tax Services",
	},
	{
		id: "2",
		invoiceNumber: "INV-2024-002",
		description: "Business License Renewal",
		amount: 800,
		tax: 120,
		total: 920,
		status: "paid",
		issueDate: "2024-11-01",
		dueDate: "2024-11-30",
		paidDate: "2024-11-18",
		paymentMethod: "Credit Card ending in 4242",
		category: "Legal Services",
	},
	{
		id: "3",
		invoiceNumber: "INV-2024-003",
		description: "Monthly Compliance Review",
		amount: 1200,
		tax: 180,
		total: 1380,
		status: "paid",
		issueDate: "2024-10-01",
		dueDate: "2024-10-30",
		paidDate: "2024-10-25",
		paymentMethod: "Bank Transfer",
		category: "Compliance",
	},
	{
		id: "4",
		invoiceNumber: "INV-2024-004",
		description: "Financial Statement Review",
		amount: 1800,
		tax: 270,
		total: 2070,
		status: "overdue",
		issueDate: "2024-10-15",
		dueDate: "2024-11-15",
		category: "Financial Services",
	},
];

const mockPaymentMethods: PaymentMethod[] = [
	{
		id: "1",
		type: "credit_card",
		name: "Visa ending in 4242",
		last4: "4242",
		expiryDate: "12/26",
		isDefault: true,
	},
	{
		id: "2",
		type: "bank_account",
		name: "Checking Account ending in 1234",
		last4: "1234",
		isDefault: false,
	},
];

const paymentTrend = [
	{ month: "Jun", amount: 3200 },
	{ month: "Jul", amount: 2800 },
	{ month: "Aug", amount: 4100 },
	{ month: "Sep", amount: 3600 },
	{ month: "Oct", amount: 3250 },
	{ month: "Nov", amount: 2875 },
];

const categoryBreakdown = [
	{ category: "Tax Services", amount: 8500 },
	{ category: "Legal Services", amount: 3200 },
	{ category: "Compliance", amount: 4800 },
	{ category: "Financial Services", amount: 2100 },
];

const statusColors = {
	paid: "bg-green-100 text-green-800 border-green-200",
	pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
	overdue: "bg-red-100 text-red-800 border-red-200",
	draft: "bg-gray-100 text-gray-800 border-gray-200",
};

export function ClientPayments({ user }: ClientPaymentsProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [invoices, setInvoices] = useState(mockInvoices);

	// Filter invoices
	const filteredInvoices = invoices.filter((invoice) => {
		const matchesSearch =
			invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || invoice.status === statusFilter;
		const matchesCategory =
			categoryFilter === "all" || invoice.category === categoryFilter;
		return matchesSearch && matchesStatus && matchesCategory;
	});

	// Calculate statistics
	const totalPaid = invoices
		.filter((inv) => inv.status === "paid")
		.reduce((sum, inv) => sum + inv.total, 0);
	const totalPending = invoices
		.filter((inv) => inv.status === "pending")
		.reduce((sum, inv) => sum + inv.total, 0);
	const totalOverdue = invoices
		.filter((inv) => inv.status === "overdue")
		.reduce((sum, inv) => sum + inv.total, 0);

	const categories = [...new Set(invoices.map((inv) => inv.category))];

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-GY", {
			style: "currency",
			currency: "GYD",
		}).format(amount);
	};

	const getDaysUntilDue = (dueDate: string) => {
		const due = new Date(dueDate);
		const now = new Date();
		const diffTime = due.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Payments & Invoicing
					</h1>
					<p className="text-muted-foreground">
						Manage your invoices, payments, and billing information
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Payment Method
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Payment Method</DialogTitle>
								<DialogDescription>
									Add a new payment method to your account
								</DialogDescription>
							</DialogHeader>
							<p className="text-muted-foreground">
								Payment method form would be implemented here
							</p>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Financial Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Total Paid</p>
								<p className="font-bold text-2xl">
									{formatCurrency(totalPaid)}
								</p>
							</div>
							<div className="rounded-full bg-green-100 p-3">
								<DollarSign className="h-6 w-6 text-green-600" />
							</div>
						</div>
						<p className="text-muted-foreground text-xs">This year</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Pending</p>
								<p className="font-bold text-2xl">
									{formatCurrency(totalPending)}
								</p>
							</div>
							<div className="rounded-full bg-yellow-100 p-3">
								<Wallet className="h-6 w-6 text-yellow-600" />
							</div>
						</div>
						<p className="text-muted-foreground text-xs">
							{invoices.filter((inv) => inv.status === "pending").length}{" "}
							invoice(s)
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Overdue</p>
								<p className="font-bold text-2xl">
									{formatCurrency(totalOverdue)}
								</p>
							</div>
							<div className="rounded-full bg-red-100 p-3">
								<Calendar className="h-6 w-6 text-red-600" />
							</div>
						</div>
						<p className="text-muted-foreground text-xs">
							{invoices.filter((inv) => inv.status === "overdue").length}{" "}
							invoice(s)
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Payment Methods</p>
								<p className="font-bold text-2xl">
									{mockPaymentMethods.length}
								</p>
							</div>
							<div className="rounded-full bg-blue-100 p-3">
								<CreditCard className="h-6 w-6 text-blue-600" />
							</div>
						</div>
						<p className="text-muted-foreground text-xs">
							{mockPaymentMethods.filter((pm) => pm.isDefault).length} default
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs defaultValue="invoices" className="space-y-6">
				<TabsList>
					<TabsTrigger value="invoices">Invoices</TabsTrigger>
					<TabsTrigger value="payments">Payment Methods</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="invoices" className="space-y-6">
					{/* Filters */}
					<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
						<div className="flex-1">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search invoices..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40">
									<Filter className="mr-2 h-4 w-4" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="paid">Paid</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="overdue">Overdue</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
								</SelectContent>
							</Select>
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Invoices List */}
					<Card>
						<CardContent className="p-0">
							<div className="space-y-0">
								{filteredInvoices.map((invoice, index) => (
									<div
										key={invoice.id}
										className={`flex items-center justify-between p-6 transition-colors hover:bg-muted/50 ${
											index !== filteredInvoices.length - 1 ? "border-b" : ""
										}`}
									>
										<div className="space-y-2">
											<div className="flex items-center space-x-3">
												<h3 className="font-semibold">
													{invoice.invoiceNumber}
												</h3>
												<Badge className={statusColors[invoice.status]}>
													{invoice.status}
												</Badge>
											</div>
											<p className="text-muted-foreground text-sm">
												{invoice.description}
											</p>
											<div className="flex items-center space-x-4 text-muted-foreground text-sm">
												<span>Category: {invoice.category}</span>
												<span>
													Issued:{" "}
													{new Date(invoice.issueDate).toLocaleDateString()}
												</span>
												<span>
													Due: {new Date(invoice.dueDate).toLocaleDateString()}
													{invoice.status === "pending" && (
														<span className="ml-2 text-yellow-600">
															({getDaysUntilDue(invoice.dueDate)} days)
														</span>
													)}
												</span>
											</div>
											{invoice.paidDate && (
												<p className="text-green-600 text-sm">
													Paid on{" "}
													{new Date(invoice.paidDate).toLocaleDateString()}
													{invoice.paymentMethod &&
														` via ${invoice.paymentMethod}`}
												</p>
											)}
										</div>

										<div className="text-right">
											<p className="font-bold text-lg">
												{formatCurrency(invoice.total)}
											</p>
											<div className="flex items-center space-x-2">
												{invoice.status === "pending" && (
													<Button size="sm">Pay Now</Button>
												)}
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem>
															<Eye className="mr-2 h-4 w-4" />
															View Details
														</DropdownMenuItem>
														<DropdownMenuItem>
															<Download className="mr-2 h-4 w-4" />
															Download PDF
														</DropdownMenuItem>
														{invoice.status === "pending" && (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem>
																	<CreditCard className="mr-2 h-4 w-4" />
																	Make Payment
																</DropdownMenuItem>
															</>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="payments" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Payment Methods</CardTitle>
							<CardDescription>
								Manage your saved payment methods
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockPaymentMethods.map((method) => (
									<div
										key={method.id}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div className="flex items-center space-x-3">
											<div className="rounded-lg bg-blue-100 p-3">
												<CreditCard className="h-6 w-6 text-blue-600" />
											</div>
											<div>
												<p className="font-medium">{method.name}</p>
												{method.expiryDate && (
													<p className="text-muted-foreground text-sm">
														Expires {method.expiryDate}
													</p>
												)}
												{method.isDefault && (
													<Badge variant="outline">Default</Badge>
												)}
											</div>
										</div>
										<div className="flex items-center space-x-2">
											{!method.isDefault && (
												<Button variant="outline" size="sm">
													Set as Default
												</Button>
											)}
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem>Edit</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600">
														Remove
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Payment Trend */}
						<Card>
							<CardHeader>
								<CardTitle>Payment Trend</CardTitle>
								<CardDescription>
									Monthly payment amounts over the last 6 months
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={paymentTrend}>
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip
											formatter={(value) => [
												formatCurrency(value as number),
												"Amount",
											]}
										/>
										<Line
											type="monotone"
											dataKey="amount"
											stroke="#3b82f6"
											strokeWidth={3}
											dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Spending by Category */}
						<Card>
							<CardHeader>
								<CardTitle>Spending by Category</CardTitle>
								<CardDescription>
									Breakdown of payments by service category
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={categoryBreakdown}>
										<XAxis dataKey="category" />
										<YAxis />
										<Tooltip
											formatter={(value) => [
												formatCurrency(value as number),
												"Amount",
											]}
										/>
										<Bar dataKey="amount" fill="#3b82f6" />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
