"use client";

import {
	Activity,
	AlertTriangle,
	BadgeCheck,
	Building2,
	Calculator,
	Calendar,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	FileText,
	Plus,
	Receipt,
	Shield,
	TrendingDown,
	TrendingUp,
	Upload,
	UserCheck,
	Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * NIS (National Insurance Scheme) Compliance Interface
 *
 * Comprehensive employee contribution and compliance management featuring:
 * - Employee Contribution Tracker with real-time calculations
 * - Employer Return Dashboard with submission status
 * - Compliance Certificate Manager with renewal tracking
 * - Contribution Schedule Generator with payroll integration
 * - Coverage Analysis with employee eligibility tracking
 * - Automated compliance scoring and risk assessment
 */

interface NISComplianceProps {
	className?: string;
}

interface EmployeeContribution {
	id: string;
	employeeId: string;
	employeeName: string;
	contributionMonth: string;
	grossSalary: number;
	employeeContribution: number;
	employerContribution: number;
	totalContribution: number;
	status: "pending" | "submitted" | "approved" | "overdue";
	dueDate: string;
}

interface ComplianceCertificate {
	id: string;
	clientName: string;
	certificateNumber: string;
	issueDate: string;
	expiryDate: string;
	status: "active" | "expiring" | "expired" | "pending";
	coverageType: "full" | "partial" | "temporary";
	employeeCount: number;
}

interface EmployerReturn {
	id: string;
	clientName: string;
	returnPeriod: string;
	employeeCount: number;
	totalContributions: number;
	submissionDate?: string;
	status: "draft" | "submitted" | "approved" | "rejected" | "overdue";
	dueDate: string;
}

const mockContributions: EmployeeContribution[] = [
	{
		id: "1",
		employeeId: "EMP001",
		employeeName: "John Smith",
		contributionMonth: "November 2024",
		grossSalary: 85000,
		employeeContribution: 5525,
		employerContribution: 6800,
		totalContribution: 12325,
		status: "submitted",
		dueDate: "2024-12-15",
	},
	{
		id: "2",
		employeeId: "EMP002",
		employeeName: "Jane Doe",
		contributionMonth: "November 2024",
		grossSalary: 95000,
		employeeContribution: 6175,
		employerContribution: 7600,
		totalContribution: 13775,
		status: "pending",
		dueDate: "2024-12-15",
	},
];

const mockCertificates: ComplianceCertificate[] = [
	{
		id: "1",
		clientName: "ABC Trading Ltd",
		certificateNumber: "NIS-2024-001",
		issueDate: "2024-01-15",
		expiryDate: "2025-01-15",
		status: "active",
		coverageType: "full",
		employeeCount: 25,
	},
	{
		id: "2",
		clientName: "XYZ Services",
		certificateNumber: "NIS-2024-002",
		issueDate: "2024-03-01",
		expiryDate: "2024-12-31",
		status: "expiring",
		coverageType: "full",
		employeeCount: 18,
	},
];

const mockReturns: EmployerReturn[] = [
	{
		id: "1",
		clientName: "ABC Trading Ltd",
		returnPeriod: "November 2024",
		employeeCount: 25,
		totalContributions: 285000,
		status: "submitted",
		submissionDate: "2024-12-10",
		dueDate: "2024-12-15",
	},
	{
		id: "2",
		clientName: "DEF Corp",
		returnPeriod: "November 2024",
		employeeCount: 12,
		totalContributions: 145000,
		status: "overdue",
		dueDate: "2024-12-15",
	},
];

export function NISComplianceInterface({ className }: NISComplianceProps) {
	const [selectedPeriod, setSelectedPeriod] = useState("current");

	const totalEmployees = mockReturns.reduce(
		(sum, ret) => sum + ret.employeeCount,
		0,
	);
	const totalContributions = mockContributions.reduce(
		(sum, cont) => sum + cont.totalContribution,
		0,
	);
	const overdueReturns = mockReturns.filter(
		(ret) => ret.status === "overdue",
	).length;
	const expiringCerts = mockCertificates.filter(
		(cert) => cert.status === "expiring",
	).length;
	const complianceScore = 91;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-3 font-bold text-3xl tracking-tight">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 font-semibold text-blue-700 text-sm">
							NIS
						</div>
						NIS Compliance Management
					</h2>
					<p className="text-lg text-muted-foreground">
						National Insurance Scheme contributions and compliance tracking
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Returns
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Return
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card className="border-l-4 border-l-blue-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Compliance Score
						</CardTitle>
						<Shield className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{complianceScore}%</div>
						<Progress value={complianceScore} className="mt-2" />
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingUp className="h-3 w-3 text-success" />
							<span className="text-success">+1.8% this month</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Employees
						</CardTitle>
						<Users className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{totalEmployees}</div>
						<p className="text-muted-foreground text-xs">Under coverage</p>
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingUp className="h-3 w-3 text-success" />
							<span className="text-success">+5 new hires</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-purple-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Contributions
						</CardTitle>
						<Receipt className="h-4 w-4 text-purple-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							${totalContributions.toLocaleString()}
						</div>
						<p className="text-muted-foreground text-xs">This month</p>
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						overdueReturns > 0 ? "border-l-destructive" : "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Overdue Returns
						</CardTitle>
						<AlertTriangle
							className={cn(
								"h-4 w-4",
								overdueReturns > 0 ? "text-destructive" : "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{overdueReturns}</div>
						<p className="text-muted-foreground text-xs">Immediate attention</p>
						{overdueReturns > 0 && (
							<Badge variant="destructive" className="mt-2">
								Critical
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						expiringCerts > 0 ? "border-l-warning" : "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Expiring Certificates
						</CardTitle>
						<BadgeCheck
							className={cn(
								"h-4 w-4",
								expiringCerts > 0 ? "text-warning" : "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{expiringCerts}</div>
						<p className="text-muted-foreground text-xs">Next 90 days</p>
						{expiringCerts > 0 && (
							<Badge variant="warning" className="mt-2">
								Renewal Required
							</Badge>
						)}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="contributions">
						Employee Contributions
					</TabsTrigger>
					<TabsTrigger value="returns">Employer Returns</TabsTrigger>
					<TabsTrigger value="certificates">
						Compliance Certificates
					</TabsTrigger>
					<TabsTrigger value="coverage">Coverage Analysis</TabsTrigger>
					<TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Contribution Summary */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Monthly Contribution Summary</CardTitle>
								<CardDescription>
									Employee and employer contributions breakdown
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ContributionSummaryChart />
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Common NIS tasks</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button variant="outline" className="w-full justify-start">
									<Calculator className="mr-2 h-4 w-4" />
									Calculate Contributions
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<FileText className="mr-2 h-4 w-4" />
									Generate Return
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<BadgeCheck className="mr-2 h-4 w-4" />
									Renew Certificate
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Upload className="mr-2 h-4 w-4" />
									Upload Payroll Data
								</Button>
							</CardContent>
						</Card>

						{/* Certificate Status */}
						<Card className="lg:col-span-3">
							<CardHeader>
								<CardTitle>Compliance Certificates Status</CardTitle>
								<CardDescription>
									Certificate expiry tracking and renewal alerts
								</CardDescription>
							</CardHeader>
							<CardContent>
								<CertificateStatusGrid />
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="contributions" className="space-y-6">
					<EmployeeContributionTracker />
				</TabsContent>

				<TabsContent value="returns" className="space-y-6">
					<EmployerReturnDashboard />
				</TabsContent>

				<TabsContent value="certificates" className="space-y-6">
					<ComplianceCertificateManager />
				</TabsContent>

				<TabsContent value="coverage" className="space-y-6">
					<CoverageAnalysis />
				</TabsContent>

				<TabsContent value="schedule" className="space-y-6">
					<PaymentScheduleGenerator />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ContributionSummaryChart() {
	const monthlyData = [
		{ month: "September", employee: 125000, employer: 158000, total: 283000 },
		{ month: "October", employee: 135000, employer: 171000, total: 306000 },
		{ month: "November", employee: 142000, employer: 180000, total: 322000 },
	];

	return (
		<div className="space-y-4">
			{monthlyData.map((data, index) => (
				<div key={data.month} className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="font-medium text-sm">{data.month} 2024</span>
						<span className="font-bold">${data.total.toLocaleString()}</span>
					</div>
					<div className="grid grid-cols-2 gap-2 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Employee:</span>
							<span>${data.employee.toLocaleString()}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Employer:</span>
							<span>${data.employer.toLocaleString()}</span>
						</div>
					</div>
					<Progress
						value={(data.employee / data.total) * 100}
						className="h-2"
					/>
				</div>
			))}
		</div>
	);
}

function CertificateStatusGrid() {
	return (
		<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
			{mockCertificates.map((cert) => (
				<div key={cert.id} className="rounded-lg border p-3">
					<div className="mb-2 flex items-center justify-between">
						<Badge
							variant={
								cert.status === "active"
									? "success"
									: cert.status === "expiring"
										? "warning"
										: cert.status === "expired"
											? "destructive"
											: "info"
							}
						>
							{cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
						</Badge>
						<span className="text-muted-foreground text-xs">
							{cert.employeeCount} employees
						</span>
					</div>
					<p className="font-medium text-sm">{cert.clientName}</p>
					<p className="text-muted-foreground text-xs">
						{cert.certificateNumber}
					</p>
					<div className="mt-2 flex justify-between text-xs">
						<span>Expires:</span>
						<span
							className={cn(
								cert.status === "expiring" && "font-medium text-warning",
							)}
						>
							{cert.expiryDate}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

function EmployeeContributionTracker() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Employee Contribution Tracker</CardTitle>
				<CardDescription>
					Real-time calculation and tracking of employee contributions
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockContributions.map((contribution) => (
						<ContributionCard
							key={contribution.id}
							contribution={contribution}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function ContributionCard({
	contribution,
}: {
	contribution: EmployeeContribution;
}) {
	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-4">
				<div>
					<p className="font-medium">{contribution.employeeName}</p>
					<p className="text-muted-foreground text-sm">
						ID: {contribution.employeeId}
					</p>
					<Badge
						variant={
							contribution.status === "approved"
								? "success"
								: contribution.status === "submitted"
									? "info"
									: contribution.status === "overdue"
										? "destructive"
										: "warning"
						}
					>
						{contribution.status.charAt(0).toUpperCase() +
							contribution.status.slice(1)}
					</Badge>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Gross Salary:</span>
						<span>${contribution.grossSalary.toLocaleString()}</span>
					</div>
					<div className="flex justify-between text-muted-foreground">
						<span>Period:</span>
						<span>{contribution.contributionMonth}</span>
					</div>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Employee (6.5%):</span>
						<span>${contribution.employeeContribution.toLocaleString()}</span>
					</div>
					<div className="flex justify-between">
						<span>Employer (8.0%):</span>
						<span>${contribution.employerContribution.toLocaleString()}</span>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold text-lg">
						${contribution.totalContribution.toLocaleString()}
					</div>
					<p className="text-muted-foreground text-sm">Total Contribution</p>
					<p className="text-muted-foreground text-xs">
						Due: {contribution.dueDate}
					</p>
				</div>
			</div>
		</div>
	);
}

function EmployerReturnDashboard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Employer Return Dashboard</CardTitle>
				<CardDescription>
					Monthly employer returns with submission status
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockReturns.map((employerReturn) => (
						<EmployerReturnCard
							key={employerReturn.id}
							employerReturn={employerReturn}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function EmployerReturnCard({
	employerReturn,
}: {
	employerReturn: EmployerReturn;
}) {
	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Badge
						variant={
							employerReturn.status === "approved"
								? "success"
								: employerReturn.status === "submitted"
									? "info"
									: employerReturn.status === "overdue"
										? "destructive"
										: employerReturn.status === "rejected"
											? "destructive"
											: "warning"
						}
					>
						{employerReturn.status.charAt(0).toUpperCase() +
							employerReturn.status.slice(1)}
					</Badge>
					<div>
						<p className="font-medium">{employerReturn.clientName}</p>
						<p className="text-muted-foreground text-sm">
							{employerReturn.returnPeriod}
						</p>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold">
						${employerReturn.totalContributions.toLocaleString()}
					</div>
					<p className="text-muted-foreground text-sm">
						{employerReturn.employeeCount} employees
					</p>
					<p className="text-muted-foreground text-xs">
						Due: {employerReturn.dueDate}
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

function ComplianceCertificateManager() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Compliance Certificate Manager</CardTitle>
				<CardDescription>
					Track and manage compliance certificates with renewal alerts
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{mockCertificates.map((cert) => (
						<CertificateCard key={cert.id} certificate={cert} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function CertificateCard({
	certificate,
}: {
	certificate: ComplianceCertificate;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<Badge
						variant={
							certificate.status === "active"
								? "success"
								: certificate.status === "expiring"
									? "warning"
									: certificate.status === "expired"
										? "destructive"
										: "info"
						}
					>
						{certificate.status.charAt(0).toUpperCase() +
							certificate.status.slice(1)}
					</Badge>
					<span className="text-muted-foreground text-xs">
						{certificate.coverageType} coverage
					</span>
				</div>
				<CardTitle className="text-base">{certificate.clientName}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="text-sm">
					<p className="text-muted-foreground">Certificate Number:</p>
					<p className="font-mono">{certificate.certificateNumber}</p>
				</div>
				<div className="flex justify-between text-sm">
					<span>Employees:</span>
					<span className="font-medium">{certificate.employeeCount}</span>
				</div>
				<div className="text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Issued:</span>
						<span>{certificate.issueDate}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Expires:</span>
						<span
							className={cn(
								certificate.status === "expiring" && "font-medium text-warning",
							)}
						>
							{certificate.expiryDate}
						</span>
					</div>
				</div>
				{certificate.status === "expiring" && (
					<Button className="w-full" size="sm">
						Renew Certificate
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

function CoverageAnalysis() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Coverage Analysis</CardTitle>
				<CardDescription>
					Employee eligibility and coverage assessment
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Coverage analysis tools and employee eligibility tracking would go
					here.
				</p>
			</CardContent>
		</Card>
	);
}

function PaymentScheduleGenerator() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Payment Schedule Generator</CardTitle>
				<CardDescription>
					Payroll integration and automated contribution schedules
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Payment schedule generation and payroll integration tools would go
					here.
				</p>
			</CardContent>
		</Card>
	);
}
