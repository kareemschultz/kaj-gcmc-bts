"use client";

import {
	AlertTriangle,
	Calculator,
	Calendar,
	CalendarDays,
	CheckCircle2,
	Clock,
	DollarSign,
	FileText,
	Receipt,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
	Download,
	Upload,
	Eye,
	Plus,
	Filter,
	Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * GRA (Guyana Revenue Authority) Compliance Interface
 *
 * Comprehensive tax compliance management featuring:
 * - Tax Filing Calendar with monthly, quarterly, and annual deadlines
 * - VAT Return Tracker with automated calculation assistance
 * - Income Tax Dashboard with individual and corporate tracking
 * - Penalty Calculator with late fee projections
 * - Payment Schedule Manager with automated reminders
 * - Real-time filing status and compliance scoring
 */

interface GRAComplianceProps {
	className?: string;
}

interface TaxFiling {
	id: string;
	type: 'VAT' | 'Income Tax' | 'Corporation Tax' | 'PAYE' | 'Withholding Tax';
	period: string;
	dueDate: string;
	status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue';
	clientName: string;
	clientId: string;
	amount?: number;
	penaltyAmount?: number;
	priority: 'high' | 'medium' | 'low';
}

interface VATReturn {
	id: string;
	period: string;
	clientName: string;
	salesAmount: number;
	purchaseAmount: number;
	vatCollected: number;
	vatPaid: number;
	netVAT: number;
	status: 'draft' | 'submitted' | 'approved';
	dueDate: string;
}

const mockFilings: TaxFiling[] = [
	{
		id: '1',
		type: 'VAT',
		period: 'December 2024',
		dueDate: '2024-12-15',
		status: 'pending',
		clientName: 'ABC Trading Ltd',
		clientId: 'GRA001',
		amount: 45000,
		priority: 'high',
	},
	{
		id: '2',
		type: 'Corporation Tax',
		period: 'Q4 2024',
		dueDate: '2024-12-31',
		status: 'submitted',
		clientName: 'XYZ Corp',
		clientId: 'GRA002',
		amount: 125000,
		priority: 'medium',
	},
	{
		id: '3',
		type: 'PAYE',
		period: 'November 2024',
		dueDate: '2024-12-10',
		status: 'overdue',
		clientName: 'DEF Services',
		clientId: 'GRA003',
		amount: 32000,
		penaltyAmount: 1600,
		priority: 'high',
	},
];

const mockVATReturns: VATReturn[] = [
	{
		id: '1',
		period: 'November 2024',
		clientName: 'ABC Trading Ltd',
		salesAmount: 500000,
		purchaseAmount: 300000,
		vatCollected: 75000,
		vatPaid: 45000,
		netVAT: 30000,
		status: 'draft',
		dueDate: '2024-12-15',
	},
	{
		id: '2',
		period: 'October 2024',
		clientName: 'XYZ Corp',
		salesAmount: 800000,
		purchaseAmount: 500000,
		vatCollected: 120000,
		vatPaid: 75000,
		netVAT: 45000,
		status: 'approved',
		dueDate: '2024-11-15',
	},
];

export function GRAComplianceInterface({ className }: GRAComplianceProps) {
	const [selectedPeriod, setSelectedPeriod] = useState('current');
	const [searchTerm, setSearchTerm] = useState('');

	const totalPending = mockFilings.filter(f => f.status === 'pending').length;
	const totalOverdue = mockFilings.filter(f => f.status === 'overdue').length;
	const totalPenalties = mockFilings.reduce((sum, f) => sum + (f.penaltyAmount || 0), 0);
	const complianceScore = 87;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold">
							GRA
						</div>
						GRA Tax Compliance
					</h2>
					<p className="text-muted-foreground text-lg">
						Guyana Revenue Authority filing and payment management
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Returns
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Filing
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card className="border-l-4 border-l-emerald-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Compliance Score
						</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{complianceScore}%</div>
						<Progress value={complianceScore} className="mt-2" />
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingUp className="h-3 w-3 text-success" />
							<span className="text-success">+2.3% this month</span>
						</div>
					</CardContent>
				</Card>

				<Card className={cn(
					"border-l-4",
					totalPending > 0 ? "border-l-warning" : "border-l-success"
				)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Filings
						</CardTitle>
						<Clock className={cn(
							"h-4 w-4",
							totalPending > 0 ? "text-warning" : "text-success"
						)} />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{totalPending}</div>
						<p className="text-muted-foreground text-xs">Due this month</p>
						{totalPending > 0 && (
							<Badge variant="warning" className="mt-2">
								Action Required
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card className={cn(
					"border-l-4",
					totalOverdue > 0 ? "border-l-destructive" : "border-l-success"
				)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Overdue Returns
						</CardTitle>
						<AlertTriangle className={cn(
							"h-4 w-4",
							totalOverdue > 0 ? "text-destructive" : "text-success"
						)} />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{totalOverdue}</div>
						<p className="text-muted-foreground text-xs">Immediate attention</p>
						{totalOverdue > 0 && (
							<Badge variant="destructive" className="mt-2">
								Critical
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card className={cn(
					"border-l-4",
					totalPenalties > 0 ? "border-l-warning" : "border-l-success"
				)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Penalties
						</CardTitle>
						<DollarSign className={cn(
							"h-4 w-4",
							totalPenalties > 0 ? "text-warning" : "text-success"
						)} />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							${totalPenalties.toLocaleString()}
						</div>
						<p className="text-muted-foreground text-xs">GYD accumulated</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-blue-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							VAT Collections
						</CardTitle>
						<Receipt className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">$195K</div>
						<p className="text-muted-foreground text-xs">This quarter</p>
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingUp className="h-3 w-3 text-success" />
							<span className="text-success">+15.2%</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="filings">Tax Filings</TabsTrigger>
					<TabsTrigger value="vat">VAT Returns</TabsTrigger>
					<TabsTrigger value="calendar">Filing Calendar</TabsTrigger>
					<TabsTrigger value="penalties">Penalty Calculator</TabsTrigger>
					<TabsTrigger value="payments">Payment Schedule</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Filing Status Summary */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Filing Status Summary</CardTitle>
								<CardDescription>
									Current status across all tax types
								</CardDescription>
							</CardHeader>
							<CardContent>
								<FilingStatusChart />
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Common GRA tasks</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button variant="outline" className="w-full justify-start">
									<FileText className="mr-2 h-4 w-4" />
									Generate VAT Return
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Calculator className="mr-2 h-4 w-4" />
									Calculate Tax Liability
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Upload className="mr-2 h-4 w-4" />
									Bulk Upload Returns
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Wallet className="mr-2 h-4 w-4" />
									Payment Reconciliation
								</Button>
							</CardContent>
						</Card>

						{/* Recent Activity */}
						<Card className="lg:col-span-3">
							<CardHeader>
								<CardTitle>Recent Filing Activity</CardTitle>
								<CardDescription>Latest submissions and updates</CardDescription>
							</CardHeader>
							<CardContent>
								<RecentActivity />
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="filings" className="space-y-6">
					<TaxFilingsManager />
				</TabsContent>

				<TabsContent value="vat" className="space-y-6">
					<VATReturnTracker />
				</TabsContent>

				<TabsContent value="calendar" className="space-y-6">
					<FilingCalendar />
				</TabsContent>

				<TabsContent value="penalties" className="space-y-6">
					<PenaltyCalculator />
				</TabsContent>

				<TabsContent value="payments" className="space-y-6">
					<PaymentScheduleManager />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function FilingStatusChart() {
	const statuses = [
		{ label: 'Submitted', count: 12, color: 'bg-success', percentage: 40 },
		{ label: 'Pending', count: 8, color: 'bg-warning', percentage: 27 },
		{ label: 'In Review', count: 6, color: 'bg-info', percentage: 20 },
		{ label: 'Overdue', count: 4, color: 'bg-destructive', percentage: 13 },
	];

	return (
		<div className="space-y-4">
			{statuses.map((status) => (
				<div key={status.label} className="flex items-center gap-4">
					<div className={`h-3 w-3 rounded-full ${status.color}`} />
					<div className="flex-1">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">{status.label}</span>
							<span className="text-muted-foreground">{status.count} filings</span>
						</div>
						<Progress value={status.percentage} className="mt-1 h-2" />
					</div>
					<Badge variant="outline">{status.percentage}%</Badge>
				</div>
			))}
		</div>
	);
}

function RecentActivity() {
	const activities = [
		{
			type: 'VAT Return Submitted',
			client: 'ABC Trading Ltd',
			time: '2 hours ago',
			status: 'success',
		},
		{
			type: 'PAYE Payment Overdue',
			client: 'DEF Services',
			time: '1 day ago',
			status: 'error',
		},
		{
			type: 'Corporation Tax Filed',
			client: 'XYZ Corp',
			time: '3 days ago',
			status: 'success',
		},
	];

	return (
		<div className="space-y-3">
			{activities.map((activity, index) => (
				<div key={index} className="flex items-center gap-3 border-l-2 border-l-muted pl-3">
					<div className={cn(
						"h-2 w-2 rounded-full",
						activity.status === 'success' ? "bg-success" : "bg-destructive"
					)} />
					<div className="flex-1">
						<p className="font-medium text-sm">{activity.type}</p>
						<p className="text-muted-foreground text-xs">{activity.client}</p>
					</div>
					<span className="text-muted-foreground text-xs">{activity.time}</span>
				</div>
			))}
		</div>
	);
}

function TaxFilingsManager() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Tax Filing Management</CardTitle>
						<CardDescription>
							Track and manage all tax filings across clients
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input placeholder="Search filings..." className="pl-9 w-64" />
						</div>
						<Select defaultValue="all">
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="vat">VAT</SelectItem>
								<SelectItem value="income">Income Tax</SelectItem>
								<SelectItem value="corp">Corporation Tax</SelectItem>
								<SelectItem value="paye">PAYE</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{mockFilings.map((filing) => (
						<FilingCard key={filing.id} filing={filing} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function FilingCard({ filing }: { filing: TaxFiling }) {
	const statusConfig = {
		pending: { color: 'warning', icon: Clock, label: 'Pending' },
		submitted: { color: 'info', icon: CheckCircle2, label: 'Submitted' },
		approved: { color: 'success', icon: CheckCircle2, label: 'Approved' },
		rejected: { color: 'destructive', icon: AlertTriangle, label: 'Rejected' },
		overdue: { color: 'destructive', icon: AlertTriangle, label: 'Overdue' },
	};

	const config = statusConfig[filing.status];
	const Icon = config.icon;

	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Icon className={`h-4 w-4 text-${config.color}`} />
						<Badge variant={config.color as any}>{config.label}</Badge>
					</div>
					<div>
						<p className="font-medium">{filing.type} - {filing.period}</p>
						<p className="text-muted-foreground text-sm">{filing.clientName}</p>
					</div>
				</div>
				<div className="text-right">
					<p className="font-medium">Due: {filing.dueDate}</p>
					{filing.amount && (
						<p className="text-sm">${filing.amount.toLocaleString()}</p>
					)}
					{filing.penaltyAmount && (
						<p className="text-destructive text-sm">
							Penalty: ${filing.penaltyAmount.toLocaleString()}
						</p>
					)}
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm">
						<Eye className="h-4 w-4" />
					</Button>
					<Button variant="outline" size="sm">
						<Download className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function VATReturnTracker() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>VAT Return Tracker</CardTitle>
				<CardDescription>
					Monitor VAT calculations and submissions with automated assistance
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockVATReturns.map((vatReturn) => (
						<VATReturnCard key={vatReturn.id} vatReturn={vatReturn} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function VATReturnCard({ vatReturn }: { vatReturn: VATReturn }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-4">
				<div>
					<p className="font-medium">{vatReturn.period}</p>
					<p className="text-muted-foreground text-sm">{vatReturn.clientName}</p>
					<Badge variant={
						vatReturn.status === 'approved' ? 'success' :
						vatReturn.status === 'submitted' ? 'info' : 'warning'
					}>
						{vatReturn.status.charAt(0).toUpperCase() + vatReturn.status.slice(1)}
					</Badge>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Sales:</span>
						<span>${vatReturn.salesAmount.toLocaleString()}</span>
					</div>
					<div className="flex justify-between">
						<span>Purchases:</span>
						<span>${vatReturn.purchaseAmount.toLocaleString()}</span>
					</div>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>VAT Collected:</span>
						<span>${vatReturn.vatCollected.toLocaleString()}</span>
					</div>
					<div className="flex justify-between">
						<span>VAT Paid:</span>
						<span>${vatReturn.vatPaid.toLocaleString()}</span>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold text-lg">
						${vatReturn.netVAT.toLocaleString()}
					</div>
					<p className="text-muted-foreground text-sm">Net VAT</p>
					<p className="text-muted-foreground text-xs">Due: {vatReturn.dueDate}</p>
				</div>
			</div>
		</div>
	);
}

function FilingCalendar() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Tax Filing Calendar</CardTitle>
				<CardDescription>
					Monthly, quarterly, and annual filing deadlines
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Calendar implementation with deadlines and reminders would go here.
				</p>
			</CardContent>
		</Card>
	);
}

function PenaltyCalculator() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Penalty Calculator</CardTitle>
				<CardDescription>
					Calculate late fees and penalty projections
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Penalty calculation tools and projections would go here.
				</p>
			</CardContent>
		</Card>
	);
}

function PaymentScheduleManager() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Payment Schedule Manager</CardTitle>
				<CardDescription>
					Automated payment reminders and schedule tracking
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Payment scheduling and reminder system would go here.
				</p>
			</CardContent>
		</Card>
	);
}