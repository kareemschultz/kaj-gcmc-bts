"use client";

import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Users,
	UserCheck,
	Download,
	Upload,
	Eye,
	Plus,
	Shuffle,
	Edit3,
	MapPin,
	Hash,
	CreditCard,
	TrendingUp,
	TrendingDown,
	Shield,
	Activity,
	Network,
	Archive,
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
 * DCRA (Deeds and Commercial Registry Authority) Compliance Interface
 *
 * Comprehensive business registration and commercial registry management featuring:
 * - Business Registration Dashboard with renewal tracking
 * - Annual Return Calendar with submission deadlines
 * - Director Change Tracker with approval workflows
 * - Share Transfer Manager with documentation requirements
 * - Corporate Structure Visualizer with relationship mapping
 * - Compliance scoring and risk assessment for registry requirements
 */

interface DCRAComplianceProps {
	className?: string;
}

interface BusinessRegistration {
	id: string;
	companyName: string;
	registrationNumber: string;
	registrationDate: string;
	renewalDate: string;
	businessType: 'Private Limited' | 'Public Limited' | 'Partnership' | 'Sole Proprietorship';
	status: 'active' | 'pending_renewal' | 'expired' | 'suspended';
	registeredAddress: string;
	directorCount: number;
	shareCapital: number;
}

interface AnnualReturn {
	id: string;
	companyName: string;
	registrationNumber: string;
	returnYear: string;
	dueDate: string;
	submissionDate?: string;
	status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue';
	returnType: 'annual' | 'interim' | 'final';
	fee: number;
}

interface DirectorChange {
	id: string;
	companyName: string;
	changeType: 'appointment' | 'resignation' | 'details_update' | 'address_change';
	directorName: string;
	effectiveDate: string;
	submissionDate: string;
	status: 'pending' | 'approved' | 'rejected' | 'processing';
	documentationComplete: boolean;
}

interface ShareTransfer {
	id: string;
	companyName: string;
	transferorName: string;
	transfereeName: string;
	numberOfShares: number;
	shareValue: number;
	transferDate: string;
	status: 'draft' | 'submitted' | 'approved' | 'rejected';
	stampDuty: number;
	registrationFee: number;
}

const mockRegistrations: BusinessRegistration[] = [
	{
		id: '1',
		companyName: 'ABC Trading Ltd',
		registrationNumber: 'REG-2020-001',
		registrationDate: '2020-01-15',
		renewalDate: '2025-01-15',
		businessType: 'Private Limited',
		status: 'active',
		registeredAddress: '123 Main Street, Georgetown',
		directorCount: 3,
		shareCapital: 1000000,
	},
	{
		id: '2',
		companyName: 'XYZ Services Inc',
		registrationNumber: 'REG-2021-045',
		registrationDate: '2021-03-20',
		renewalDate: '2024-12-31',
		businessType: 'Private Limited',
		status: 'pending_renewal',
		registeredAddress: '456 Commerce Ave, Georgetown',
		directorCount: 2,
		shareCapital: 500000,
	},
];

const mockAnnualReturns: AnnualReturn[] = [
	{
		id: '1',
		companyName: 'ABC Trading Ltd',
		registrationNumber: 'REG-2020-001',
		returnYear: '2024',
		dueDate: '2024-12-31',
		status: 'pending',
		returnType: 'annual',
		fee: 25000,
	},
	{
		id: '2',
		companyName: 'DEF Corp',
		registrationNumber: 'REG-2019-032',
		returnYear: '2024',
		dueDate: '2024-11-30',
		submissionDate: '2024-11-25',
		status: 'submitted',
		returnType: 'annual',
		fee: 25000,
	},
];

const mockDirectorChanges: DirectorChange[] = [
	{
		id: '1',
		companyName: 'ABC Trading Ltd',
		changeType: 'appointment',
		directorName: 'John Smith',
		effectiveDate: '2024-12-01',
		submissionDate: '2024-11-25',
		status: 'processing',
		documentationComplete: true,
	},
	{
		id: '2',
		companyName: 'XYZ Services Inc',
		changeType: 'resignation',
		directorName: 'Jane Doe',
		effectiveDate: '2024-11-30',
		submissionDate: '2024-11-15',
		status: 'approved',
		documentationComplete: true,
	},
];

const mockShareTransfers: ShareTransfer[] = [
	{
		id: '1',
		companyName: 'ABC Trading Ltd',
		transferorName: 'Smith Holdings',
		transfereeName: 'Johnson Investments',
		numberOfShares: 1000,
		shareValue: 100000,
		transferDate: '2024-11-20',
		status: 'submitted',
		stampDuty: 500,
		registrationFee: 1500,
	},
];

export function DCRAComplianceInterface({ className }: DCRAComplianceProps) {
	const [selectedYear, setSelectedYear] = useState('2024');

	const activeRegistrations = mockRegistrations.filter(reg => reg.status === 'active').length;
	const pendingRenewals = mockRegistrations.filter(reg => reg.status === 'pending_renewal').length;
	const overdueReturns = mockAnnualReturns.filter(ret => ret.status === 'overdue').length;
	const pendingChanges = mockDirectorChanges.filter(change => change.status === 'pending' || change.status === 'processing').length;
	const complianceScore = 85;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-sm font-semibold">
							DCRA
						</div>
						DCRA Registry Management
					</h2>
					<p className="text-muted-foreground text-lg">
						Deeds and Commercial Registry Authority compliance tracking
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Registry
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Registration
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card className="border-l-4 border-l-amber-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Compliance Score
						</CardTitle>
						<Shield className="h-4 w-4 text-amber-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{complianceScore}%</div>
						<Progress value={complianceScore} className="mt-2" />
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingDown className="h-3 w-3 text-warning" />
							<span className="text-warning">-1.2% this month</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Registrations
						</CardTitle>
						<Building2 className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{activeRegistrations}</div>
						<p className="text-muted-foreground text-xs">Companies in good standing</p>
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingUp className="h-3 w-3 text-success" />
							<span className="text-success">+2 new registrations</span>
						</div>
					</CardContent>
				</Card>

				<Card className={cn(
					"border-l-4",
					pendingRenewals > 0 ? "border-l-warning" : "border-l-success"
				)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Renewals
						</CardTitle>
						<Calendar className={cn(
							"h-4 w-4",
							pendingRenewals > 0 ? "text-warning" : "text-success"
						)} />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{pendingRenewals}</div>
						<p className="text-muted-foreground text-xs">Due next 90 days</p>
						{pendingRenewals > 0 && (
							<Badge variant="warning" className="mt-2">
								Action Required
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card className={cn(
					"border-l-4",
					overdueReturns > 0 ? "border-l-destructive" : "border-l-success"
				)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Overdue Returns
						</CardTitle>
						<AlertTriangle className={cn(
							"h-4 w-4",
							overdueReturns > 0 ? "text-destructive" : "text-success"
						)} />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{overdueReturns}</div>
						<p className="text-muted-foreground text-xs">Annual returns</p>
						{overdueReturns > 0 && (
							<Badge variant="destructive" className="mt-2">
								Critical
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-blue-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Changes
						</CardTitle>
						<Shuffle className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{pendingChanges}</div>
						<p className="text-muted-foreground text-xs">Director/share changes</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="registrations">Business Registration</TabsTrigger>
					<TabsTrigger value="returns">Annual Returns</TabsTrigger>
					<TabsTrigger value="directors">Director Changes</TabsTrigger>
					<TabsTrigger value="shares">Share Transfers</TabsTrigger>
					<TabsTrigger value="structure">Corporate Structure</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Registration Status */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Registration Status Overview</CardTitle>
								<CardDescription>
									Current business registration and compliance status
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RegistrationStatusChart />
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Common DCRA tasks</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button variant="outline" className="w-full justify-start">
									<FileText className="mr-2 h-4 w-4" />
									File Annual Return
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Users className="mr-2 h-4 w-4" />
									Update Directors
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Shuffle className="mr-2 h-4 w-4" />
									Transfer Shares
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Edit3 className="mr-2 h-4 w-4" />
									Update Details
								</Button>
							</CardContent>
						</Card>

						{/* Upcoming Deadlines */}
						<Card className="lg:col-span-3">
							<CardHeader>
								<CardTitle>Upcoming Registry Deadlines</CardTitle>
								<CardDescription>Critical filing and renewal dates</CardDescription>
							</CardHeader>
							<CardContent>
								<UpcomingDeadlines />
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="registrations" className="space-y-6">
					<BusinessRegistrationDashboard />
				</TabsContent>

				<TabsContent value="returns" className="space-y-6">
					<AnnualReturnCalendar />
				</TabsContent>

				<TabsContent value="directors" className="space-y-6">
					<DirectorChangeTracker />
				</TabsContent>

				<TabsContent value="shares" className="space-y-6">
					<ShareTransferManager />
				</TabsContent>

				<TabsContent value="structure" className="space-y-6">
					<CorporateStructureVisualizer />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function RegistrationStatusChart() {
	const statuses = [
		{ label: 'Active', count: 28, color: 'bg-success', percentage: 70 },
		{ label: 'Pending Renewal', count: 8, color: 'bg-warning', percentage: 20 },
		{ label: 'Expired', count: 3, color: 'bg-destructive', percentage: 7.5 },
		{ label: 'Suspended', count: 1, color: 'bg-muted', percentage: 2.5 },
	];

	return (
		<div className="space-y-4">
			{statuses.map((status) => (
				<div key={status.label} className="flex items-center gap-4">
					<div className={`h-3 w-3 rounded-full ${status.color}`} />
					<div className="flex-1">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">{status.label}</span>
							<span className="text-muted-foreground">{status.count} companies</span>
						</div>
						<Progress value={status.percentage} className="mt-1 h-2" />
					</div>
					<Badge variant="outline">{status.percentage}%</Badge>
				</div>
			))}
		</div>
	);
}

function UpcomingDeadlines() {
	const deadlines = [
		{
			type: 'Annual Return',
			company: 'ABC Trading Ltd',
			date: '2024-12-31',
			urgency: 'high',
			daysLeft: 15,
		},
		{
			type: 'Business Renewal',
			company: 'XYZ Services Inc',
			date: '2024-12-31',
			urgency: 'high',
			daysLeft: 15,
		},
		{
			type: 'Director Change',
			company: 'DEF Corp',
			date: '2025-01-15',
			urgency: 'medium',
			daysLeft: 30,
		},
	];

	return (
		<div className="space-y-3">
			{deadlines.map((deadline, index) => (
				<div key={index} className={cn(
					"flex items-center justify-between border-l-4 pl-3",
					deadline.urgency === 'high' ? "border-l-destructive" :
					deadline.urgency === 'medium' ? "border-l-warning" : "border-l-info"
				)}>
					<div>
						<p className="font-medium text-sm">{deadline.type}</p>
						<p className="text-muted-foreground text-xs">{deadline.company}</p>
					</div>
					<div className="text-right">
						<p className="font-medium text-sm">{deadline.date}</p>
						<Badge variant={
							deadline.urgency === 'high' ? 'destructive' :
							deadline.urgency === 'medium' ? 'warning' : 'info'
						}>
							{deadline.daysLeft} days left
						</Badge>
					</div>
				</div>
			))}
		</div>
	);
}

function BusinessRegistrationDashboard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Business Registration Dashboard</CardTitle>
				<CardDescription>
					Track business registrations and renewal status
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockRegistrations.map((registration) => (
						<RegistrationCard key={registration.id} registration={registration} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function RegistrationCard({ registration }: { registration: BusinessRegistration }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-4">
				<div>
					<p className="font-medium">{registration.companyName}</p>
					<p className="text-muted-foreground text-sm">{registration.registrationNumber}</p>
					<Badge variant={
						registration.status === 'active' ? 'success' :
						registration.status === 'pending_renewal' ? 'warning' :
						registration.status === 'expired' ? 'destructive' : 'info'
					}>
						{registration.status.replace('_', ' ').charAt(0).toUpperCase() +
						 registration.status.replace('_', ' ').slice(1)}
					</Badge>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Type:</span>
						<span>{registration.businessType}</span>
					</div>
					<div className="flex justify-between">
						<span>Directors:</span>
						<span>{registration.directorCount}</span>
					</div>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Registered:</span>
						<span>{registration.registrationDate}</span>
					</div>
					<div className="flex justify-between">
						<span>Renewal Due:</span>
						<span className={cn(
							registration.status === 'pending_renewal' && "text-warning font-medium"
						)}>
							{registration.renewalDate}
						</span>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold">
						${registration.shareCapital.toLocaleString()}
					</div>
					<p className="text-muted-foreground text-sm">Share Capital</p>
					<div className="mt-2 flex gap-1">
						<Button variant="outline" size="sm">
							<Eye className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm">
							<Edit3 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function AnnualReturnCalendar() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Annual Return Calendar</CardTitle>
				<CardDescription>
					Track annual return submissions and deadlines
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockAnnualReturns.map((annualReturn) => (
						<AnnualReturnCard key={annualReturn.id} annualReturn={annualReturn} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function AnnualReturnCard({ annualReturn }: { annualReturn: AnnualReturn }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Badge variant={
						annualReturn.status === 'approved' ? 'success' :
						annualReturn.status === 'submitted' ? 'info' :
						annualReturn.status === 'overdue' ? 'destructive' :
						annualReturn.status === 'rejected' ? 'destructive' : 'warning'
					}>
						{annualReturn.status.charAt(0).toUpperCase() + annualReturn.status.slice(1)}
					</Badge>
					<div>
						<p className="font-medium">{annualReturn.companyName}</p>
						<p className="text-muted-foreground text-sm">
							{annualReturn.returnYear} Annual Return
						</p>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold">${annualReturn.fee.toLocaleString()}</div>
					<p className="text-muted-foreground text-sm">Filing fee</p>
					<p className="text-muted-foreground text-xs">
						Due: {annualReturn.dueDate}
					</p>
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

function DirectorChangeTracker() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Director Change Tracker</CardTitle>
				<CardDescription>
					Track director appointments, resignations, and updates
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockDirectorChanges.map((change) => (
						<DirectorChangeCard key={change.id} change={change} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function DirectorChangeCard({ change }: { change: DirectorChange }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Badge variant={
						change.status === 'approved' ? 'success' :
						change.status === 'processing' ? 'info' :
						change.status === 'rejected' ? 'destructive' : 'warning'
					}>
						{change.status.charAt(0).toUpperCase() + change.status.slice(1)}
					</Badge>
					<div>
						<p className="font-medium">{change.directorName}</p>
						<p className="text-muted-foreground text-sm">
							{change.changeType.replace('_', ' ').charAt(0).toUpperCase() +
							 change.changeType.replace('_', ' ').slice(1)} - {change.companyName}
						</p>
					</div>
				</div>
				<div className="text-right">
					<p className="font-medium text-sm">Effective: {change.effectiveDate}</p>
					<p className="text-muted-foreground text-xs">
						Submitted: {change.submissionDate}
					</p>
					{change.documentationComplete ? (
						<Badge variant="success" className="mt-1">
							<CheckCircle2 className="mr-1 h-3 w-3" />
							Complete
						</Badge>
					) : (
						<Badge variant="warning" className="mt-1">
							<AlertTriangle className="mr-1 h-3 w-3" />
							Incomplete
						</Badge>
					)}
				</div>
			</div>
		</div>
	);
}

function ShareTransferManager() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Share Transfer Manager</CardTitle>
				<CardDescription>
					Manage share transfers and documentation requirements
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockShareTransfers.map((transfer) => (
						<ShareTransferCard key={transfer.id} transfer={transfer} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function ShareTransferCard({ transfer }: { transfer: ShareTransfer }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-3">
				<div>
					<p className="font-medium">{transfer.companyName}</p>
					<Badge variant={
						transfer.status === 'approved' ? 'success' :
						transfer.status === 'submitted' ? 'info' :
						transfer.status === 'rejected' ? 'destructive' : 'warning'
					}>
						{transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
					</Badge>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>From:</span>
						<span>{transfer.transferorName}</span>
					</div>
					<div className="flex justify-between">
						<span>To:</span>
						<span>{transfer.transfereeName}</span>
					</div>
					<div className="flex justify-between">
						<span>Shares:</span>
						<span>{transfer.numberOfShares.toLocaleString()}</span>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold">${transfer.shareValue.toLocaleString()}</div>
					<p className="text-muted-foreground text-sm">Transfer Value</p>
					<p className="text-muted-foreground text-xs">
						Date: {transfer.transferDate}
					</p>
					<div className="mt-2 text-xs">
						<p>Stamp Duty: ${transfer.stampDuty}</p>
						<p>Reg. Fee: ${transfer.registrationFee}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function CorporateStructureVisualizer() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Corporate Structure Visualizer</CardTitle>
				<CardDescription>
					Visualize company relationships and ownership structures
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<Network className="mx-auto h-16 w-16 text-muted-foreground" />
						<p className="mt-4 text-muted-foreground">
							Corporate structure visualization would be implemented here with
							interactive diagrams showing ownership relationships, subsidiaries,
							and holding company structures.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}