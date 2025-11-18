"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
	BarChart3,
	Calendar,
	Files,
	FileText,
	Home,
	Mail,
	Settings,
	Shield,
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
import { DataTable } from "@/components/ui/data-table";
import {
	DatePicker,
	DateRangePicker,
	DateTimePicker,
	TimePicker,
} from "@/components/ui/date-picker";
import { FileUpload, type FileWithPreview } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	CollapsibleMenu,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { MultiStepForm, type StepperStep } from "@/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Sample data for the data table
interface SampleData {
	id: string;
	name: string;
	email: string;
	status: string;
	created: Date;
}

const sampleData: SampleData[] = [
	{
		id: "1",
		name: "John Doe",
		email: "john@example.com",
		status: "active",
		created: new Date("2024-01-15"),
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane@example.com",
		status: "pending",
		created: new Date("2024-02-20"),
	},
	{
		id: "3",
		name: "Bob Johnson",
		email: "bob@example.com",
		status: "inactive",
		created: new Date("2024-03-10"),
	},
	{
		id: "4",
		name: "Alice Brown",
		email: "alice@example.com",
		status: "active",
		created: new Date("2024-04-05"),
	},
	{
		id: "5",
		name: "Charlie Wilson",
		email: "charlie@example.com",
		status: "pending",
		created: new Date("2024-05-12"),
	},
];

const columns: ColumnDef<SampleData>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					variant={
						status === "active"
							? "default"
							: status === "pending"
								? "secondary"
								: "outline"
					}
				>
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "created",
		header: "Created",
		cell: ({ row }) => {
			return format(row.getValue("created"), "MMM d, yyyy");
		},
	},
];

const steps: StepperStep[] = [
	{
		id: "personal",
		title: "Personal Information",
		description: "Basic details about yourself",
	},
	{
		id: "company",
		title: "Company Details",
		description: "Information about your organization",
	},
	{
		id: "preferences",
		title: "Preferences",
		description: "Configure your settings",
		isOptional: true,
	},
	{
		id: "review",
		title: "Review & Submit",
		description: "Review your information",
	},
];

export function ComponentsDemo() {
	const [selectedDate, setSelectedDate] = useState<Date>();
	const [selectedDateRange, setSelectedDateRange] = useState<{
		from?: Date;
		to?: Date;
	}>({});
	const [selectedTime, setSelectedTime] = useState<Date>();
	const [selectedDateTime, setSelectedDateTime] = useState<Date>();
	const [_uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
	const [currentStep, setCurrentStep] = useState(0);
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const handleExport = (data: SampleData[]) => {
		console.log("Exporting data:", data);
		// Implement export logic here
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSubmit = () => {
		console.log("Form submitted!");
	};

	return (
		<div className="space-y-12">
			{/* Command Palette Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Command Palette
					</CardTitle>
					<CardDescription>
						Global search and navigation component (Press{" "}
						<kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl+K</kbd> or{" "}
						<kbd className="rounded bg-muted px-2 py-1 text-xs">Cmd+K</kbd>)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="rounded-lg border bg-muted/50 p-4">
							<h4 className="mb-2 font-medium">Features:</h4>
							<ul className="space-y-1 text-muted-foreground text-sm">
								<li>• Quick navigation between pages</li>
								<li>• Action shortcuts for common tasks</li>
								<li>• Recent items and search functionality</li>
								<li>• Keyboard shortcuts for power users</li>
							</ul>
						</div>
						<Button
							onClick={() => {
								const event = new KeyboardEvent("keydown", {
									key: "k",
									ctrlKey: true,
									metaKey: false,
								});
								document.dispatchEvent(event);
							}}
						>
							Open Command Palette (Ctrl+K)
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Data Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Advanced Data Table
					</CardTitle>
					<CardDescription>
						Feature-rich data table with sorting, filtering, pagination, and
						export functionality
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={sampleData}
						searchKey="name"
						searchPlaceholder="Search by name..."
						enableExport={true}
						enableRowSelection={true}
						onExport={handleExport}
					/>
				</CardContent>
			</Card>

			{/* Multi-step Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Multi-step Form Wizard
					</CardTitle>
					<CardDescription>
						Complex workflow forms with step navigation and validation
					</CardDescription>
				</CardHeader>
				<CardContent>
					<MultiStepForm
						steps={steps}
						currentStep={currentStep}
						onStepChange={setCurrentStep}
						onNext={handleNext}
						onPrevious={handlePrevious}
						onSubmit={handleSubmit}
						enableStepClick={true}
					>
						<div className="flex min-h-[300px] items-center justify-center rounded-lg border bg-muted/20">
							{currentStep === 0 && (
								<div className="space-y-4 text-center">
									<h3 className="font-semibold text-xl">
										Personal Information
									</h3>
									<div className="max-w-md space-y-4">
										<div>
											<Label htmlFor="firstName">First Name</Label>
											<Input
												id="firstName"
												placeholder="Enter your first name"
											/>
										</div>
										<div>
											<Label htmlFor="lastName">Last Name</Label>
											<Input id="lastName" placeholder="Enter your last name" />
										</div>
									</div>
								</div>
							)}
							{currentStep === 1 && (
								<div className="space-y-4 text-center">
									<h3 className="font-semibold text-xl">Company Details</h3>
									<div className="max-w-md space-y-4">
										<div>
											<Label htmlFor="company">Company Name</Label>
											<Input id="company" placeholder="Enter company name" />
										</div>
										<div>
											<Label htmlFor="role">Role</Label>
											<Input id="role" placeholder="Your role in the company" />
										</div>
									</div>
								</div>
							)}
							{currentStep === 2 && (
								<div className="space-y-4 text-center">
									<h3 className="font-semibold text-xl">Preferences</h3>
									<div className="max-w-md space-y-4">
										<div>
											<Label htmlFor="notifications">Email Notifications</Label>
											<Textarea
												id="notifications"
												placeholder="Configure notification preferences"
											/>
										</div>
									</div>
								</div>
							)}
							{currentStep === 3 && (
								<div className="space-y-4 text-center">
									<h3 className="font-semibold text-xl">Review & Submit</h3>
									<p className="text-muted-foreground">
										Please review your information before submitting.
									</p>
								</div>
							)}
						</div>
					</MultiStepForm>
				</CardContent>
			</Card>

			{/* File Upload */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Files className="h-5 w-5" />
						File Upload
					</CardTitle>
					<CardDescription>
						Drag-and-drop file upload with preview and validation
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FileUpload
						onFilesChange={setUploadedFiles}
						accept="image/*,.pdf,.doc,.docx"
						maxFiles={5}
						maxSize={10 * 1024 * 1024} // 10MB
						multiple={true}
						showPreview={true}
						allowRemove={true}
					/>
				</CardContent>
			</Card>

			{/* Date/Time Pickers */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Date & Time Pickers
					</CardTitle>
					<CardDescription>
						Various date and time selection components for scheduling
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="date" className="w-full">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="date">Date Picker</TabsTrigger>
							<TabsTrigger value="range">Date Range</TabsTrigger>
							<TabsTrigger value="time">Time Picker</TabsTrigger>
							<TabsTrigger value="datetime">Date & Time</TabsTrigger>
						</TabsList>

						<TabsContent value="date" className="space-y-4">
							<div className="space-y-2">
								<Label>Select a date:</Label>
								<DatePicker
									date={selectedDate}
									onSelect={setSelectedDate}
									placeholder="Choose a date"
								/>
								{selectedDate && (
									<p className="text-muted-foreground text-sm">
										Selected: {format(selectedDate, "PPP")}
									</p>
								)}
							</div>
						</TabsContent>

						<TabsContent value="range" className="space-y-4">
							<div className="space-y-2">
								<Label>Select a date range:</Label>
								<DateRangePicker
									from={selectedDateRange.from}
									to={selectedDateRange.to}
									onSelect={setSelectedDateRange}
									placeholder="Choose date range"
								/>
								{selectedDateRange.from && (
									<p className="text-muted-foreground text-sm">
										Range: {format(selectedDateRange.from, "MMM d, y")}
										{selectedDateRange.to &&
											` - ${format(selectedDateRange.to, "MMM d, y")}`}
									</p>
								)}
							</div>
						</TabsContent>

						<TabsContent value="time" className="space-y-4">
							<div className="space-y-2">
								<Label>Select a time:</Label>
								<TimePicker
									time={selectedTime}
									onSelect={setSelectedTime}
									placeholder="Choose time"
								/>
								{selectedTime && (
									<p className="text-muted-foreground text-sm">
										Selected: {format(selectedTime, "HH:mm")}
									</p>
								)}
							</div>
						</TabsContent>

						<TabsContent value="datetime" className="space-y-4">
							<div className="space-y-2">
								<Label>Select date and time:</Label>
								<DateTimePicker
									date={selectedDateTime}
									onSelect={setSelectedDateTime}
									placeholder="Choose date and time"
								/>
								{selectedDateTime && (
									<p className="text-muted-foreground text-sm">
										Selected: {format(selectedDateTime, "PPP 'at' HH:mm")}
									</p>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Sidebar Navigation */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Sidebar Navigation
					</CardTitle>
					<CardDescription>
						Collapsible sidebar with nested navigation and responsive design
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-hidden rounded-lg border">
						<SidebarProvider
							defaultOpen={sidebarOpen}
							onOpenChange={setSidebarOpen}
						>
							<div className="flex h-[400px]">
								<Sidebar variant="inset">
									<SidebarHeader>
										<div className="flex items-center gap-2 px-2 py-1">
											<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
												<Home className="h-4 w-4" />
											</div>
											<span className="font-semibold">GCMC-KAJ</span>
										</div>
									</SidebarHeader>
									<SidebarContent>
										<SidebarGroup>
											<SidebarGroupLabel>Navigation</SidebarGroupLabel>
											<SidebarGroupContent>
												<SidebarMenu>
													<SidebarMenuItem>
														<SidebarMenuButton asChild>
															<a href="/dashboard">
																<Home className="h-4 w-4" />
																<span>Dashboard</span>
															</a>
														</SidebarMenuButton>
													</SidebarMenuItem>
													<SidebarMenuItem>
														<SidebarMenuButton asChild>
															<a href="/clients">
																<Users className="h-4 w-4" />
																<span>Clients</span>
															</a>
														</SidebarMenuButton>
													</SidebarMenuItem>
													<CollapsibleMenu
														trigger={
															<>
																<Files className="h-4 w-4" />
																<span>Documents</span>
															</>
														}
													>
														<SidebarMenuButton asChild>
															<a href="/documents/active">Active</a>
														</SidebarMenuButton>
														<SidebarMenuButton asChild>
															<a href="/documents/archived">Archived</a>
														</SidebarMenuButton>
														<SidebarMenuButton asChild>
															<a href="/documents/pending">Pending</a>
														</SidebarMenuButton>
													</CollapsibleMenu>
													<SidebarMenuItem>
														<SidebarMenuButton asChild>
															<a href="/analytics">
																<BarChart3 className="h-4 w-4" />
																<span>Analytics</span>
															</a>
														</SidebarMenuButton>
													</SidebarMenuItem>
												</SidebarMenu>
											</SidebarGroupContent>
										</SidebarGroup>
										<SidebarGroup>
											<SidebarGroupLabel>Settings</SidebarGroupLabel>
											<SidebarGroupContent>
												<SidebarMenu>
													<SidebarMenuItem>
														<SidebarMenuButton asChild>
															<a href="/settings">
																<Settings className="h-4 w-4" />
																<span>General</span>
															</a>
														</SidebarMenuButton>
													</SidebarMenuItem>
													<SidebarMenuItem>
														<SidebarMenuButton asChild>
															<a href="/notifications">
																<Mail className="h-4 w-4" />
																<span>Notifications</span>
															</a>
														</SidebarMenuButton>
													</SidebarMenuItem>
												</SidebarMenu>
											</SidebarGroupContent>
										</SidebarGroup>
									</SidebarContent>
									<SidebarFooter>
										<div className="p-2">
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<span>System Operational</span>
											</div>
										</div>
									</SidebarFooter>
								</Sidebar>
								<main className="flex-1 p-4">
									<div className="mb-4 flex items-center gap-2">
										<SidebarTrigger />
										<h2 className="font-semibold">Main Content Area</h2>
									</div>
									<div className="rounded-lg border bg-muted/20 p-6">
										<h3 className="mb-2 font-medium">Demo Content</h3>
										<p className="text-muted-foreground text-sm">
											This is the main content area. The sidebar can be
											collapsed using the trigger button or by clicking the
											items. On mobile, it becomes a slide-out menu.
										</p>
									</div>
								</main>
							</div>
						</SidebarProvider>
					</div>
				</CardContent>
			</Card>

			{/* Implementation Notes */}
			<Card>
				<CardHeader>
					<CardTitle>Implementation Notes</CardTitle>
					<CardDescription>
						Key features and technical details of the enterprise UI components
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-3">
							<h4 className="font-medium">Component Features:</h4>
							<ul className="space-y-1 text-muted-foreground text-sm">
								<li>• TypeScript-first with proper type safety</li>
								<li>• Accessible components following ARIA standards</li>
								<li>• Mobile-responsive design patterns</li>
								<li>• Dark mode support with CSS variables</li>
								<li>• Customizable with Tailwind CSS classes</li>
								<li>• Server Component compatible</li>
							</ul>
						</div>
						<div className="space-y-3">
							<h4 className="font-medium">Enterprise Ready:</h4>
							<ul className="space-y-1 text-muted-foreground text-sm">
								<li>• Advanced data handling and export</li>
								<li>• Form validation and error handling</li>
								<li>• File upload with security validation</li>
								<li>• Keyboard navigation support</li>
								<li>• Loading and error states</li>
								<li>• Production-ready performance</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
