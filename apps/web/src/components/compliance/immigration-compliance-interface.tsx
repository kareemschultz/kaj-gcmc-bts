"use client";

import {
	Activity,
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	CreditCard,
	Download,
	Eye,
	FileText,
	Globe,
	MapPin,
	IdCard as Passport,
	Plane,
	Plus,
	Shield,
	Timer,
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
 * Immigration Department Compliance Interface
 *
 * Comprehensive immigration compliance management featuring:
 * - Work Permit Dashboard with application status tracking
 * - Visa Processing Timeline with stage-by-stage progress
 * - Residency Permit Manager with renewal notifications
 * - Compliance Checklist with document requirements
 * - Application Analytics with processing time predictions
 * - Multi-permit type tracking and renewal management
 */

interface ImmigrationComplianceProps {
	className?: string;
}

interface WorkPermit {
	id: string;
	applicantName: string;
	passportNumber: string;
	employerName: string;
	permitType:
		| "Short Term"
		| "Long Term"
		| "Renewal"
		| "Skilled Worker"
		| "Investor";
	applicationDate: string;
	expiryDate?: string;
	status:
		| "pending"
		| "processing"
		| "approved"
		| "rejected"
		| "expired"
		| "renewal_required";
	processingStage: string;
	nationality: string;
	position: string;
	salary: number;
}

interface VisaApplication {
	id: string;
	applicantName: string;
	visaType: "Tourist" | "Business" | "Transit" | "Student" | "Work" | "Family";
	applicationDate: string;
	processingStage:
		| "submitted"
		| "documents_review"
		| "interview"
		| "security_check"
		| "decision"
		| "approved"
		| "rejected";
	nationality: string;
	purpose: string;
	duration: number;
	fee: number;
	expectedDecision: string;
}

interface ResidencyPermit {
	id: string;
	holderName: string;
	permitNumber: string;
	permitType: "Temporary" | "Permanent" | "Conditional" | "Investment";
	issueDate: string;
	expiryDate: string;
	status: "active" | "expiring" | "expired" | "renewal_pending";
	renewalEligible: boolean;
	dependents: number;
}

const mockWorkPermits: WorkPermit[] = [
	{
		id: "1",
		applicantName: "John Smith",
		passportNumber: "US123456789",
		employerName: "ABC Trading Ltd",
		permitType: "Skilled Worker",
		applicationDate: "2024-10-15",
		expiryDate: "2025-10-15",
		status: "approved",
		processingStage: "Completed",
		nationality: "USA",
		position: "Software Engineer",
		salary: 180000,
	},
	{
		id: "2",
		applicantName: "Maria Rodriguez",
		passportNumber: "ES987654321",
		employerName: "XYZ Corp",
		permitType: "Long Term",
		applicationDate: "2024-11-01",
		status: "processing",
		processingStage: "Security Check",
		nationality: "Spain",
		position: "Marketing Director",
		salary: 220000,
	},
	{
		id: "3",
		applicantName: "James Wilson",
		passportNumber: "CA456789123",
		employerName: "DEF Services",
		permitType: "Renewal",
		applicationDate: "2024-09-20",
		expiryDate: "2024-12-31",
		status: "renewal_required",
		processingStage: "Pending Renewal",
		nationality: "Canada",
		position: "Project Manager",
		salary: 195000,
	},
];

const mockVisaApplications: VisaApplication[] = [
	{
		id: "1",
		applicantName: "Sarah Johnson",
		visaType: "Business",
		applicationDate: "2024-11-20",
		processingStage: "documents_review",
		nationality: "UK",
		purpose: "Business Meetings",
		duration: 30,
		fee: 5000,
		expectedDecision: "2024-12-05",
	},
	{
		id: "2",
		applicantName: "Hans Mueller",
		visaType: "Tourist",
		applicationDate: "2024-11-18",
		processingStage: "security_check",
		nationality: "Germany",
		purpose: "Tourism",
		duration: 14,
		fee: 3000,
		expectedDecision: "2024-12-03",
	},
];

const mockResidencyPermits: ResidencyPermit[] = [
	{
		id: "1",
		holderName: "David Chen",
		permitNumber: "RP-2022-001",
		permitType: "Permanent",
		issueDate: "2022-01-15",
		expiryDate: "2027-01-15",
		status: "active",
		renewalEligible: false,
		dependents: 2,
	},
	{
		id: "2",
		holderName: "Anna Petrov",
		permitNumber: "RP-2021-045",
		permitType: "Temporary",
		issueDate: "2021-06-10",
		expiryDate: "2024-12-31",
		status: "expiring",
		renewalEligible: true,
		dependents: 0,
	},
];

export function ImmigrationComplianceInterface({
	className,
}: ImmigrationComplianceProps) {
	const [selectedPeriod, setSelectedPeriod] = useState("current");

	const totalPermits = mockWorkPermits.length;
	const activePermits = mockWorkPermits.filter(
		(p) => p.status === "approved",
	).length;
	const renewalRequired = mockWorkPermits.filter(
		(p) => p.status === "renewal_required",
	).length;
	const processingApplications = mockWorkPermits.filter(
		(p) => p.status === "processing",
	).length;
	const expiringPermits = mockResidencyPermits.filter(
		(p) => p.status === "expiring",
	).length;
	const complianceScore = 94;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-3 font-bold text-3xl tracking-tight">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 font-semibold text-purple-700 text-sm">
							IMM
						</div>
						Immigration Compliance
					</h2>
					<p className="text-lg text-muted-foreground">
						Work permits, visas, and residency permit management
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Reports
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Application
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card className="border-l-4 border-l-purple-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Compliance Score
						</CardTitle>
						<Shield className="h-4 w-4 text-purple-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{complianceScore}%</div>
						<Progress value={complianceScore} className="mt-2" />
						<div className="mt-2 flex items-center gap-1 text-xs">
							<TrendingUp className="h-3 w-3 text-success" />
							<span className="text-success">+4.1% this month</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Permits
						</CardTitle>
						<UserCheck className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{activePermits}</div>
						<p className="text-muted-foreground text-xs">Currently valid</p>
						<div className="mt-2 flex items-center gap-1 text-xs">
							<span className="text-muted-foreground">
								{totalPermits} total permits
							</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-blue-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Processing</CardTitle>
						<Clock className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{processingApplications}</div>
						<p className="text-muted-foreground text-xs">
							Applications in progress
						</p>
						<div className="mt-2">
							<Badge variant="info" className="text-xs">
								Avg 21 days
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						renewalRequired > 0 ? "border-l-warning" : "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Renewal Required
						</CardTitle>
						<Calendar
							className={cn(
								"h-4 w-4",
								renewalRequired > 0 ? "text-warning" : "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{renewalRequired}</div>
						<p className="text-muted-foreground text-xs">Work permits</p>
						{renewalRequired > 0 && (
							<Badge variant="warning" className="mt-2">
								Action Required
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						expiringPermits > 0 ? "border-l-warning" : "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Expiring Permits
						</CardTitle>
						<AlertTriangle
							className={cn(
								"h-4 w-4",
								expiringPermits > 0 ? "text-warning" : "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{expiringPermits}</div>
						<p className="text-muted-foreground text-xs">Next 90 days</p>
						{expiringPermits > 0 && (
							<Badge variant="warning" className="mt-2">
								Renewal Due
							</Badge>
						)}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="work-permits">Work Permits</TabsTrigger>
					<TabsTrigger value="visas">Visa Applications</TabsTrigger>
					<TabsTrigger value="residency">Residency Permits</TabsTrigger>
					<TabsTrigger value="analytics">Processing Analytics</TabsTrigger>
					<TabsTrigger value="compliance">Compliance Checklist</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Application Status Summary */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Application Status Summary</CardTitle>
								<CardDescription>
									Current status across all application types
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ApplicationStatusChart />
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Common immigration tasks</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button variant="outline" className="w-full justify-start">
									<FileText className="mr-2 h-4 w-4" />
									New Work Permit
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Passport className="mr-2 h-4 w-4" />
									Visa Application
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Globe className="mr-2 h-4 w-4" />
									Residency Permit
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Timer className="mr-2 h-4 w-4" />
									Process Renewal
								</Button>
							</CardContent>
						</Card>

						{/* Processing Timeline */}
						<Card className="lg:col-span-3">
							<CardHeader>
								<CardTitle>Current Processing Timeline</CardTitle>
								<CardDescription>
									Active applications and their stages
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ProcessingTimeline />
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="work-permits" className="space-y-6">
					<WorkPermitDashboard />
				</TabsContent>

				<TabsContent value="visas" className="space-y-6">
					<VisaProcessingTimeline />
				</TabsContent>

				<TabsContent value="residency" className="space-y-6">
					<ResidencyPermitManager />
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<ProcessingAnalytics />
				</TabsContent>

				<TabsContent value="compliance" className="space-y-6">
					<ComplianceChecklist />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ApplicationStatusChart() {
	const statuses = [
		{ label: "Approved", count: 8, color: "bg-success", percentage: 40 },
		{ label: "Processing", count: 5, color: "bg-info", percentage: 25 },
		{ label: "Pending Review", count: 4, color: "bg-warning", percentage: 20 },
		{
			label: "Renewal Required",
			count: 3,
			color: "bg-warning",
			percentage: 15,
		},
	];

	return (
		<div className="space-y-4">
			{statuses.map((status) => (
				<div key={status.label} className="flex items-center gap-4">
					<div className={`h-3 w-3 rounded-full ${status.color}`} />
					<div className="flex-1">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">{status.label}</span>
							<span className="text-muted-foreground">
								{status.count} applications
							</span>
						</div>
						<Progress value={status.percentage} className="mt-1 h-2" />
					</div>
					<Badge variant="outline">{status.percentage}%</Badge>
				</div>
			))}
		</div>
	);
}

function ProcessingTimeline() {
	const timeline = [
		{
			applicant: "Maria Rodriguez",
			type: "Work Permit",
			stage: "Security Check",
			progress: 75,
			expectedCompletion: "2024-12-15",
		},
		{
			applicant: "Sarah Johnson",
			type: "Business Visa",
			stage: "Document Review",
			progress: 40,
			expectedCompletion: "2024-12-05",
		},
		{
			applicant: "Hans Mueller",
			type: "Tourist Visa",
			stage: "Security Check",
			progress: 60,
			expectedCompletion: "2024-12-03",
		},
	];

	return (
		<div className="space-y-4">
			{timeline.map((item, index) => (
				<div key={index} className="flex items-center gap-4">
					<div className="flex-1">
						<div className="mb-1 flex items-center justify-between">
							<div>
								<p className="font-medium text-sm">{item.applicant}</p>
								<p className="text-muted-foreground text-xs">
									{item.type} - {item.stage}
								</p>
							</div>
							<div className="text-right">
								<p className="font-medium text-sm">{item.progress}%</p>
								<p className="text-muted-foreground text-xs">
									Est: {item.expectedCompletion}
								</p>
							</div>
						</div>
						<Progress value={item.progress} className="h-2" />
					</div>
				</div>
			))}
		</div>
	);
}

function WorkPermitDashboard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Work Permit Dashboard</CardTitle>
				<CardDescription>
					Track work permit applications and status
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockWorkPermits.map((permit) => (
						<WorkPermitCard key={permit.id} permit={permit} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function WorkPermitCard({ permit }: { permit: WorkPermit }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-4">
				<div>
					<p className="font-medium">{permit.applicantName}</p>
					<p className="text-muted-foreground text-sm">
						{permit.passportNumber}
					</p>
					<Badge
						variant={
							permit.status === "approved"
								? "success"
								: permit.status === "processing"
									? "info"
									: permit.status === "renewal_required"
										? "warning"
										: permit.status === "expired"
											? "destructive"
											: permit.status === "rejected"
												? "destructive"
												: "warning"
						}
					>
						{permit.status.replace("_", " ").charAt(0).toUpperCase() +
							permit.status.replace("_", " ").slice(1)}
					</Badge>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Employer:</span>
						<span>{permit.employerName}</span>
					</div>
					<div className="flex justify-between">
						<span>Position:</span>
						<span>{permit.position}</span>
					</div>
					<div className="flex justify-between">
						<span>Nationality:</span>
						<span>{permit.nationality}</span>
					</div>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Permit Type:</span>
						<span>{permit.permitType}</span>
					</div>
					<div className="flex justify-between">
						<span>Applied:</span>
						<span>{permit.applicationDate}</span>
					</div>
					{permit.expiryDate && (
						<div className="flex justify-between">
							<span>Expires:</span>
							<span
								className={cn(
									permit.status === "renewal_required" &&
										"font-medium text-warning",
								)}
							>
								{permit.expiryDate}
							</span>
						</div>
					)}
				</div>
				<div className="text-right">
					<div className="font-bold">${permit.salary.toLocaleString()}</div>
					<p className="text-muted-foreground text-sm">Annual Salary</p>
					<p className="text-muted-foreground text-xs">
						{permit.processingStage}
					</p>
					<div className="mt-2 flex justify-end gap-1">
						<Button variant="outline" size="sm">
							<Eye className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function VisaProcessingTimeline() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Visa Processing Timeline</CardTitle>
				<CardDescription>
					Stage-by-stage progress tracking for visa applications
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockVisaApplications.map((visa) => (
						<VisaApplicationCard key={visa.id} visa={visa} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function VisaApplicationCard({ visa }: { visa: VisaApplication }) {
	const stageProgress = {
		submitted: 20,
		documents_review: 40,
		interview: 60,
		security_check: 80,
		decision: 90,
		approved: 100,
		rejected: 100,
	};

	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-3">
				<div>
					<p className="font-medium">{visa.applicantName}</p>
					<p className="text-muted-foreground text-sm">{visa.nationality}</p>
					<Badge
						variant={
							visa.processingStage === "approved"
								? "success"
								: visa.processingStage === "rejected"
									? "destructive"
									: "info"
						}
					>
						{visa.processingStage.replace("_", " ").charAt(0).toUpperCase() +
							visa.processingStage.replace("_", " ").slice(1)}
					</Badge>
				</div>
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Type:</span>
						<span>{visa.visaType}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Purpose:</span>
						<span>{visa.purpose}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Duration:</span>
						<span>{visa.duration} days</span>
					</div>
					<div className="mt-2">
						<div className="mb-1 flex justify-between text-xs">
							<span>Progress</span>
							<span>{stageProgress[visa.processingStage]}%</span>
						</div>
						<Progress
							value={stageProgress[visa.processingStage]}
							className="h-2"
						/>
					</div>
				</div>
				<div className="text-right">
					<div className="font-bold">${visa.fee.toLocaleString()}</div>
					<p className="text-muted-foreground text-sm">Application fee</p>
					<p className="text-muted-foreground text-xs">
						Expected: {visa.expectedDecision}
					</p>
				</div>
			</div>
		</div>
	);
}

function ResidencyPermitManager() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Residency Permit Manager</CardTitle>
				<CardDescription>
					Track residency permits with renewal notifications
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockResidencyPermits.map((permit) => (
						<ResidencyPermitCard key={permit.id} permit={permit} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function ResidencyPermitCard({ permit }: { permit: ResidencyPermit }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="grid gap-4 md:grid-cols-3">
				<div>
					<p className="font-medium">{permit.holderName}</p>
					<p className="text-muted-foreground text-sm">{permit.permitNumber}</p>
					<Badge
						variant={
							permit.status === "active"
								? "success"
								: permit.status === "expiring"
									? "warning"
									: permit.status === "expired"
										? "destructive"
										: "info"
						}
					>
						{permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
					</Badge>
				</div>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span>Type:</span>
						<span>{permit.permitType}</span>
					</div>
					<div className="flex justify-between">
						<span>Issued:</span>
						<span>{permit.issueDate}</span>
					</div>
					<div className="flex justify-between">
						<span>Expires:</span>
						<span
							className={cn(
								permit.status === "expiring" && "font-medium text-warning",
							)}
						>
							{permit.expiryDate}
						</span>
					</div>
				</div>
				<div className="text-right">
					<div className="font-medium">{permit.dependents} Dependents</div>
					<div className="mt-2">
						{permit.renewalEligible ? (
							<Badge variant="info">Renewal Eligible</Badge>
						) : (
							<Badge variant="outline">Non-renewable</Badge>
						)}
					</div>
					{permit.status === "expiring" && permit.renewalEligible && (
						<Button className="mt-2" size="sm">
							Start Renewal
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

function ProcessingAnalytics() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Processing Analytics</CardTitle>
				<CardDescription>
					Processing time predictions and performance metrics
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					<div className="grid gap-4 md:grid-cols-3">
						<div className="text-center">
							<div className="font-bold text-2xl text-blue-600">21 days</div>
							<p className="text-muted-foreground text-sm">
								Avg Processing Time
							</p>
						</div>
						<div className="text-center">
							<div className="font-bold text-2xl text-green-600">94%</div>
							<p className="text-muted-foreground text-sm">Approval Rate</p>
						</div>
						<div className="text-center">
							<div className="font-bold text-2xl text-purple-600">156</div>
							<p className="text-muted-foreground text-sm">Applications YTD</p>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="font-medium">Processing Time by Type</h4>
						{[
							{ type: "Tourist Visa", avgDays: 7, trend: "stable" },
							{ type: "Business Visa", avgDays: 10, trend: "improving" },
							{ type: "Work Permit", avgDays: 21, trend: "stable" },
							{ type: "Residency Permit", avgDays: 45, trend: "improving" },
						].map((item) => (
							<div
								key={item.type}
								className="flex items-center justify-between"
							>
								<span className="text-sm">{item.type}</span>
								<div className="flex items-center gap-2">
									<span className="font-medium">{item.avgDays} days</span>
									{item.trend === "improving" ? (
										<TrendingDown className="h-4 w-4 text-success" />
									) : (
										<span className="h-4 w-4" />
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ComplianceChecklist() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Compliance Checklist</CardTitle>
				<CardDescription>
					Document requirements and compliance verification
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{[
						{ item: "Valid passport (minimum 6 months)", checked: true },
						{ item: "Completed application form", checked: true },
						{ item: "Employment contract/offer letter", checked: true },
						{ item: "Police clearance certificate", checked: false },
						{ item: "Medical examination report", checked: false },
						{ item: "Proof of qualifications", checked: true },
						{ item: "Bank statements (3 months)", checked: false },
						{ item: "Passport photos (2)", checked: true },
					].map((requirement, index) => (
						<div key={index} className="flex items-center gap-3">
							<div
								className={cn(
									"flex h-4 w-4 items-center justify-center rounded border-2",
									requirement.checked
										? "border-success bg-success"
										: "border-muted-foreground",
								)}
							>
								{requirement.checked && (
									<CheckCircle2 className="h-3 w-3 text-white" />
								)}
							</div>
							<span
								className={cn(
									"text-sm",
									requirement.checked
										? "text-foreground"
										: "text-muted-foreground",
								)}
							>
								{requirement.item}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
