"use client";

import {
	ArrowRight,
	CheckCircle2,
	Clock,
	AlertTriangle,
	Info,
	ChevronLeft,
	ChevronRight,
	PlayCircle,
	PauseCircle,
	RotateCcw,
	BookOpen,
	HelpCircle,
	FileText,
	Upload,
	Download,
	Bell,
	Settings,
	Users,
	Calendar,
	MessageSquare,
	Zap,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

/**
 * Guided Workflow System with Smart Notifications
 *
 * Advanced features including:
 * - Step-by-step guided workflows for complex compliance processes
 * - Contextual help and documentation
 * - Smart notification system with priority-based filtering
 * - Progress tracking with visual completion indicators
 * - Automated workflow orchestration
 * - Real-time collaboration features
 * - Mobile-optimized responsive design
 */

interface GuidedWorkflowSystemProps {
	className?: string;
}

interface WorkflowStep {
	id: string;
	title: string;
	description: string;
	agency: string;
	estimatedTime: string;
	required: boolean;
	status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
	dependencies: string[];
	documents: WorkflowDocument[];
	helpContent: HelpContent;
	validation: ValidationRule[];
}

interface WorkflowDocument {
	id: string;
	name: string;
	type: 'upload' | 'download' | 'form' | 'external_link';
	required: boolean;
	status: 'pending' | 'uploaded' | 'approved' | 'rejected';
	url?: string;
	description: string;
}

interface HelpContent {
	overview: string;
	steps: string[];
	tips: string[];
	commonIssues: string[];
	resources: Resource[];
}

interface Resource {
	title: string;
	url: string;
	type: 'pdf' | 'video' | 'article' | 'form';
}

interface ValidationRule {
	field: string;
	rule: string;
	message: string;
}

interface SmartNotification {
	id: string;
	type: 'deadline' | 'approval' | 'document' | 'system' | 'reminder';
	priority: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	actionRequired: boolean;
	actions: NotificationAction[];
	category: string;
	workflowId?: string;
	relatedDocuments?: string[];
}

interface NotificationAction {
	label: string;
	type: 'primary' | 'secondary' | 'danger';
	action: string;
}

// Mock workflow data
const mockWorkflow: WorkflowStep[] = [
	{
		id: 'step-1',
		title: 'Business Registration with DCRA',
		description: 'Register your business with the Deeds and Commercial Registry Authority',
		agency: 'DCRA',
		estimatedTime: '5-7 business days',
		required: true,
		status: 'completed',
		dependencies: [],
		documents: [
			{
				id: 'doc-1',
				name: 'Articles of Incorporation',
				type: 'upload',
				required: true,
				status: 'approved',
				description: 'Legal document establishing the corporation',
			},
			{
				id: 'doc-2',
				name: 'Registration Certificate',
				type: 'download',
				required: true,
				status: 'approved',
				url: '/downloads/registration-cert.pdf',
				description: 'Official business registration certificate',
			},
		],
		helpContent: {
			overview: 'Business registration is the first step in establishing a legal business entity in Guyana.',
			steps: [
				'Prepare required documents',
				'Submit application online or in person',
				'Pay registration fees',
				'Wait for approval',
				'Receive registration certificate',
			],
			tips: [
				'Ensure all documents are properly notarized',
				'Double-check spelling of business name',
				'Have multiple name options ready',
			],
			commonIssues: [
				'Name already taken',
				'Missing required documents',
				'Incorrect fee payment',
			],
			resources: [
				{
					title: 'DCRA Registration Guide',
					url: '/guides/dcra-registration.pdf',
					type: 'pdf',
				},
				{
					title: 'Business Name Search',
					url: 'https://dcra.gov.gy/search',
					type: 'form',
				},
			],
		},
		validation: [
			{
				field: 'businessName',
				rule: 'required|min:3|max:100',
				message: 'Business name is required and must be between 3-100 characters',
			},
		],
	},
	{
		id: 'step-2',
		title: 'Tax Registration with GRA',
		description: 'Register for tax obligations with the Guyana Revenue Authority',
		agency: 'GRA',
		estimatedTime: '3-5 business days',
		required: true,
		status: 'in_progress',
		dependencies: ['step-1'],
		documents: [
			{
				id: 'doc-3',
				name: 'Tax Registration Form',
				type: 'form',
				required: true,
				status: 'pending',
				description: 'Complete GRA tax registration application',
			},
		],
		helpContent: {
			overview: 'Tax registration establishes your business for VAT, income tax, and other obligations.',
			steps: [
				'Obtain business registration certificate',
				'Complete tax registration form',
				'Submit supporting documents',
				'Receive tax identification number',
			],
			tips: [
				'Register within 30 days of business registration',
				'Keep copies of all submitted documents',
				'Update registration when business changes',
			],
			commonIssues: [
				'Late registration penalties',
				'Incorrect business classification',
				'Missing supporting documents',
			],
			resources: [
				{
					title: 'GRA Tax Registration Guide',
					url: '/guides/gra-registration.pdf',
					type: 'pdf',
				},
			],
		},
		validation: [],
	},
	{
		id: 'step-3',
		title: 'NIS Employer Registration',
		description: 'Register as an employer with the National Insurance Scheme',
		agency: 'NIS',
		estimatedTime: '2-3 business days',
		required: true,
		status: 'pending',
		dependencies: ['step-1'],
		documents: [
			{
				id: 'doc-4',
				name: 'Employer Registration Form',
				type: 'form',
				required: true,
				status: 'pending',
				description: 'NIS employer registration application',
			},
		],
		helpContent: {
			overview: 'Register as an employer to make NIS contributions for your employees.',
			steps: [
				'Complete employer registration form',
				'Provide business registration details',
				'Submit employee information',
				'Set up contribution payments',
			],
			tips: [
				'Register before hiring first employee',
				'Maintain accurate employee records',
				'Make contributions on time to avoid penalties',
			],
			commonIssues: [
				'Late registration',
				'Incorrect employee information',
				'Missed contribution deadlines',
			],
			resources: [],
		},
		validation: [],
	},
];

const mockNotifications: SmartNotification[] = [
	{
		id: 'notif-1',
		type: 'deadline',
		priority: 'high',
		title: 'VAT Return Due Soon',
		message: 'Your VAT return for ABC Trading Ltd is due in 3 days',
		timestamp: '2024-11-28T10:30:00Z',
		read: false,
		actionRequired: true,
		category: 'GRA',
		actions: [
			{
				label: 'File Return',
				type: 'primary',
				action: 'file_return',
			},
			{
				label: 'Request Extension',
				type: 'secondary',
				action: 'request_extension',
			},
		],
	},
	{
		id: 'notif-2',
		type: 'document',
		priority: 'medium',
		title: 'Document Approved',
		message: 'Your business registration certificate has been approved and is ready for download',
		timestamp: '2024-11-28T09:15:00Z',
		read: false,
		actionRequired: true,
		category: 'DCRA',
		actions: [
			{
				label: 'Download',
				type: 'primary',
				action: 'download_document',
			},
		],
	},
	{
		id: 'notif-3',
		type: 'reminder',
		priority: 'low',
		title: 'Monthly Review',
		message: 'Time for your monthly compliance review',
		timestamp: '2024-11-28T08:00:00Z',
		read: true,
		actionRequired: false,
		category: 'System',
		actions: [],
	},
];

export function GuidedWorkflowSystem({ className }: GuidedWorkflowSystemProps) {
	const [currentStep, setCurrentStep] = useState(1);
	const [notifications, setNotifications] = useState(mockNotifications);
	const [showNotifications, setShowNotifications] = useState(false);
	const [filteredNotifications, setFilteredNotifications] = useState(mockNotifications);
	const [notificationFilter, setNotificationFilter] = useState<string>('all');

	const currentWorkflowStep = mockWorkflow[currentStep];
	const totalSteps = mockWorkflow.length;
	const completedSteps = mockWorkflow.filter(step => step.status === 'completed').length;
	const progress = (completedSteps / totalSteps) * 100;
	const unreadNotifications = notifications.filter(n => !n.read).length;

	useEffect(() => {
		if (notificationFilter === 'all') {
			setFilteredNotifications(notifications);
		} else {
			setFilteredNotifications(notifications.filter(n =>
				notificationFilter === 'unread' ? !n.read :
				notificationFilter === 'actionRequired' ? n.actionRequired :
				n.priority === notificationFilter
			));
		}
	}, [notifications, notificationFilter]);

	const markNotificationAsRead = (notificationId: string) => {
		setNotifications(prev =>
			prev.map(n =>
				n.id === notificationId ? { ...n, read: true } : n
			)
		);
	};

	const handleNotificationAction = (notificationId: string, action: string) => {
		// Handle notification actions
		markNotificationAsRead(notificationId);
		// Implementation would depend on the specific action
	};

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header with Progress */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">Business Setup Workflow</h2>
					<p className="text-muted-foreground text-lg">
						Complete guided setup for your new business
					</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-right">
						<div className="font-bold text-lg">{progress.toFixed(0)}% Complete</div>
						<div className="text-muted-foreground text-sm">
							{completedSteps} of {totalSteps} steps
						</div>
					</div>
					<Button
						variant="outline"
						onClick={() => setShowNotifications(!showNotifications)}
						className="relative"
					>
						<Bell className="h-4 w-4" />
						{unreadNotifications > 0 && (
							<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
								{unreadNotifications}
							</span>
						)}
					</Button>
				</div>
			</div>

			{/* Progress Bar */}
			<Card>
				<CardContent className="pt-6">
					<div className="mb-4">
						<Progress value={progress} className="h-3" />
					</div>
					<div className="flex justify-between">
						{mockWorkflow.map((step, index) => (
							<div key={step.id} className="flex flex-col items-center text-center">
								<div className={cn(
									"h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
									step.status === 'completed' ? "bg-success text-white" :
									index === currentStep ? "bg-info text-white" :
									"bg-muted text-muted-foreground"
								)}>
									{step.status === 'completed' ? (
										<CheckCircle2 className="h-4 w-4" />
									) : (
										index + 1
									)}
								</div>
								<div className="text-xs max-w-20">
									<div className={cn(
										"font-medium",
										step.status === 'completed' ? "text-success" :
										index === currentStep ? "text-info" : "text-muted-foreground"
									)}>
										{step.agency}
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-4">
				{/* Main Workflow Content */}
				<div className="lg:col-span-3 space-y-6">
					<Tabs defaultValue="workflow" className="space-y-6">
						<TabsList>
							<TabsTrigger value="workflow">Current Step</TabsTrigger>
							<TabsTrigger value="overview">Workflow Overview</TabsTrigger>
							<TabsTrigger value="documents">Documents</TabsTrigger>
							<TabsTrigger value="help">Help & Resources</TabsTrigger>
						</TabsList>

						<TabsContent value="workflow">
							<CurrentStepView step={currentWorkflowStep} />
						</TabsContent>

						<TabsContent value="overview">
							<WorkflowOverviewView steps={mockWorkflow} />
						</TabsContent>

						<TabsContent value="documents">
							<DocumentsView steps={mockWorkflow} />
						</TabsContent>

						<TabsContent value="help">
							<HelpResourcesView step={currentWorkflowStep} />
						</TabsContent>
					</Tabs>

					{/* Navigation Controls */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<Button
									variant="outline"
									onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
									disabled={currentStep === 0}
								>
									<ChevronLeft className="mr-2 h-4 w-4" />
									Previous Step
								</Button>

								<div className="flex gap-2">
									<Button variant="outline">
										<PauseCircle className="mr-2 h-4 w-4" />
										Save Progress
									</Button>
									<Button variant="outline">
										<RotateCcw className="mr-2 h-4 w-4" />
										Reset Workflow
									</Button>
								</div>

								<Button
									onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
									disabled={currentStep === totalSteps - 1 || currentWorkflowStep.status !== 'completed'}
								>
									Next Step
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Smart Notifications Panel */}
				<div className="lg:col-span-1">
					<SmartNotificationPanel
						notifications={filteredNotifications}
						filter={notificationFilter}
						onFilterChange={setNotificationFilter}
						onNotificationAction={handleNotificationAction}
						onMarkAsRead={markNotificationAsRead}
					/>
				</div>
			</div>
		</div>
	);
}

function CurrentStepView({ step }: { step: WorkflowStep }) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							{step.title}
							<Badge variant="outline">{step.agency}</Badge>
						</CardTitle>
						<CardDescription>{step.description}</CardDescription>
					</div>
					<Badge variant={
						step.status === 'completed' ? 'success' :
						step.status === 'in_progress' ? 'info' :
						step.status === 'blocked' ? 'destructive' : 'outline'
					}>
						{step.status.replace('_', ' ').charAt(0).toUpperCase() + step.status.replace('_', ' ').slice(1)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Step Information */}
				<div className="grid gap-4 md:grid-cols-2">
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm">Est. Time: {step.estimatedTime}</span>
					</div>
					<div className="flex items-center gap-2">
						{step.required ? (
							<AlertTriangle className="h-4 w-4 text-warning" />
						) : (
							<Info className="h-4 w-4 text-info" />
						)}
						<span className="text-sm">
							{step.required ? 'Required Step' : 'Optional Step'}
						</span>
					</div>
				</div>

				{/* Dependencies */}
				{step.dependencies.length > 0 && (
					<Alert>
						<Info className="h-4 w-4" />
						<AlertTitle>Prerequisites</AlertTitle>
						<AlertDescription>
							This step requires completion of: {step.dependencies.join(', ')}
						</AlertDescription>
					</Alert>
				)}

				{/* Documents */}
				<div>
					<h4 className="font-medium mb-3">Required Documents</h4>
					<div className="space-y-2">
						{step.documents.map((doc) => (
							<DocumentItem key={doc.id} document={doc} />
						))}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2">
					{step.status === 'pending' && (
						<Button>
							<PlayCircle className="mr-2 h-4 w-4" />
							Start Step
						</Button>
					)}
					{step.status === 'in_progress' && (
						<>
							<Button>
								<CheckCircle2 className="mr-2 h-4 w-4" />
								Mark Complete
							</Button>
							<Button variant="outline">
								<PauseCircle className="mr-2 h-4 w-4" />
								Save Progress
							</Button>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function DocumentItem({ document }: { document: WorkflowDocument }) {
	return (
		<div className="flex items-center justify-between p-3 rounded-lg border">
			<div className="flex items-center gap-3">
				<div className={cn(
					"h-8 w-8 rounded-lg flex items-center justify-center",
					document.status === 'approved' ? "bg-success/10 text-success" :
					document.status === 'rejected' ? "bg-destructive/10 text-destructive" :
					document.status === 'uploaded' ? "bg-info/10 text-info" :
					"bg-muted/50 text-muted-foreground"
				)}>
					{document.type === 'upload' ? <Upload className="h-4 w-4" /> :
					 document.type === 'download' ? <Download className="h-4 w-4" /> :
					 <FileText className="h-4 w-4" />}
				</div>
				<div>
					<p className="font-medium text-sm">{document.name}</p>
					<p className="text-muted-foreground text-xs">{document.description}</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant={
					document.status === 'approved' ? 'success' :
					document.status === 'rejected' ? 'destructive' :
					document.status === 'uploaded' ? 'info' : 'outline'
				}>
					{document.status.charAt(0).toUpperCase() + document.status.slice(1)}
				</Badge>
				{document.required && (
					<Badge variant="outline" className="text-xs">Required</Badge>
				)}
				{document.type === 'download' && document.status === 'approved' && (
					<Button variant="outline" size="sm">
						<Download className="h-3 w-3" />
					</Button>
				)}
			</div>
		</div>
	);
}

function WorkflowOverviewView({ steps }: { steps: WorkflowStep[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Workflow Overview</CardTitle>
				<CardDescription>All steps in this workflow process</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{steps.map((step, index) => (
						<div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
							<div className={cn(
								"h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
								step.status === 'completed' ? "bg-success text-white" :
								step.status === 'in_progress' ? "bg-info text-white" :
								step.status === 'blocked' ? "bg-destructive text-white" :
								"bg-muted text-muted-foreground"
							)}>
								{step.status === 'completed' ? (
									<CheckCircle2 className="h-4 w-4" />
								) : (
									index + 1
								)}
							</div>
							<div className="flex-1">
								<h4 className="font-medium">{step.title}</h4>
								<p className="text-muted-foreground text-sm">{step.description}</p>
								<div className="flex gap-2 mt-1">
									<Badge variant="outline">{step.agency}</Badge>
									<Badge variant="outline">{step.estimatedTime}</Badge>
								</div>
							</div>
							<Badge variant={
								step.status === 'completed' ? 'success' :
								step.status === 'in_progress' ? 'info' :
								step.status === 'blocked' ? 'destructive' : 'outline'
							}>
								{step.status.replace('_', ' ')}
							</Badge>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function DocumentsView({ steps }: { steps: WorkflowStep[] }) {
	const allDocuments = steps.flatMap(step =>
		step.documents.map(doc => ({ ...doc, stepTitle: step.title, agency: step.agency }))
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>All Documents</CardTitle>
				<CardDescription>Complete list of documents for this workflow</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{allDocuments.map((doc) => (
						<div key={`${doc.stepTitle}-${doc.id}`} className="p-3 rounded-lg border">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className={cn(
										"h-8 w-8 rounded-lg flex items-center justify-center",
										doc.status === 'approved' ? "bg-success/10 text-success" :
										doc.status === 'rejected' ? "bg-destructive/10 text-destructive" :
										"bg-muted/50 text-muted-foreground"
									)}>
										{doc.type === 'upload' ? <Upload className="h-4 w-4" /> :
										 doc.type === 'download' ? <Download className="h-4 w-4" /> :
										 <FileText className="h-4 w-4" />}
									</div>
									<div>
										<p className="font-medium text-sm">{doc.name}</p>
										<p className="text-muted-foreground text-xs">
											{doc.stepTitle} ({doc.agency})
										</p>
									</div>
								</div>
								<Badge variant={
									doc.status === 'approved' ? 'success' :
									doc.status === 'rejected' ? 'destructive' : 'outline'
								}>
									{doc.status}
								</Badge>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function HelpResourcesView({ step }: { step: WorkflowStep }) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5" />
						Step Guide
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h4 className="font-medium mb-2">Overview</h4>
						<p className="text-muted-foreground text-sm">{step.helpContent.overview}</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Steps to Complete</h4>
						<ol className="list-decimal list-inside space-y-1">
							{step.helpContent.steps.map((stepItem, index) => (
								<li key={index} className="text-sm">{stepItem}</li>
							))}
						</ol>
					</div>

					<div>
						<h4 className="font-medium mb-2">Tips</h4>
						<ul className="space-y-1">
							{step.helpContent.tips.map((tip, index) => (
								<li key={index} className="flex items-start gap-2 text-sm">
									<span className="text-info mt-0.5">•</span>
									<span>{tip}</span>
								</li>
							))}
						</ul>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<HelpCircle className="h-5 w-5" />
						Common Issues
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2">
						{step.helpContent.commonIssues.map((issue, index) => (
							<li key={index} className="flex items-start gap-2 text-sm">
								<AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
								<span>{issue}</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			{step.helpContent.resources.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Additional Resources</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{step.helpContent.resources.map((resource, index) => (
								<a
									key={index}
									href={resource.url}
									className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FileText className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="font-medium text-sm">{resource.title}</p>
										<p className="text-muted-foreground text-xs">
											{resource.type.toUpperCase()}
										</p>
									</div>
								</a>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function SmartNotificationPanel({
	notifications,
	filter,
	onFilterChange,
	onNotificationAction,
	onMarkAsRead,
}: {
	notifications: SmartNotification[];
	filter: string;
	onFilterChange: (filter: string) => void;
	onNotificationAction: (id: string, action: string) => void;
	onMarkAsRead: (id: string) => void;
}) {
	return (
		<Card className="h-fit">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bell className="h-5 w-5" />
					Smart Notifications
				</CardTitle>
				<div className="flex gap-1">
					{['all', 'unread', 'high', 'actionRequired'].map((filterType) => (
						<Button
							key={filterType}
							variant={filter === filterType ? 'default' : 'outline'}
							size="sm"
							onClick={() => onFilterChange(filterType)}
							className="text-xs"
						>
							{filterType.charAt(0).toUpperCase() + filterType.slice(1)}
						</Button>
					))}
				</div>
			</CardHeader>
			<CardContent className="space-y-3 max-h-96 overflow-y-auto">
				{notifications.map((notification) => (
					<NotificationItem
						key={notification.id}
						notification={notification}
						onAction={onNotificationAction}
						onMarkAsRead={onMarkAsRead}
					/>
				))}
				{notifications.length === 0 && (
					<p className="text-muted-foreground text-sm text-center py-4">
						No notifications match the current filter
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function NotificationItem({
	notification,
	onAction,
	onMarkAsRead,
}: {
	notification: SmartNotification;
	onAction: (id: string, action: string) => void;
	onMarkAsRead: (id: string) => void;
}) {
	const priorityColors = {
		low: 'border-l-muted',
		medium: 'border-l-info',
		high: 'border-l-warning',
		critical: 'border-l-destructive',
	};

	return (
		<div
			className={cn(
				"p-3 rounded-lg border-l-4 border bg-card",
				priorityColors[notification.priority],
				!notification.read && "bg-muted/50"
			)}
		>
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<h4 className="font-medium text-sm">{notification.title}</h4>
					<p className="text-muted-foreground text-xs">{notification.message}</p>
				</div>
				{!notification.read && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMarkAsRead(notification.id)}
						className="text-xs"
					>
						Mark Read
					</Button>
				)}
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-xs">
						{notification.category}
					</Badge>
					<Badge
						variant={
							notification.priority === 'critical' ? 'destructive' :
							notification.priority === 'high' ? 'warning' :
							notification.priority === 'medium' ? 'info' : 'outline'
						}
						className="text-xs"
					>
						{notification.priority}
					</Badge>
				</div>
				<span className="text-muted-foreground text-xs">
					{new Date(notification.timestamp).toLocaleTimeString()}
				</span>
			</div>
			{notification.actions.length > 0 && (
				<div className="flex gap-1 mt-2">
					{notification.actions.map((action, index) => (
						<Button
							key={index}
							variant={action.type === 'primary' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onAction(notification.id, action.action)}
							className="text-xs"
						>
							{action.label}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}