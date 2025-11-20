"use client";

import {
	Calendar,
	CheckCircle,
	CreditCard,
	FileText,
	Settings,
	Shield,
	Star,
	User,
} from "lucide-react";
import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	useStepData,
	WizardProvider,
	type WizardStep,
} from "@/lib/wizard/wizard-context";
import { WizardLayout } from "./wizard-layout";

// Service definitions
interface Service {
	id: string;
	name: string;
	description: string;
	category: string;
	basePrice: number;
	estimatedDuration: string;
	requirements: string[];
	features: string[];
	recommended?: boolean;
}

const availableServices: Service[] = [
	{
		id: "tax_preparation",
		name: "Individual Tax Preparation",
		description:
			"Complete preparation and filing of individual income tax returns",
		category: "Tax Services",
		basePrice: 15000,
		estimatedDuration: "5-7 business days",
		requirements: ["Income statements", "Previous tax returns", "ID documents"],
		features: [
			"Tax optimization",
			"E-filing",
			"Audit support",
			"Next year planning",
		],
		recommended: true,
	},
	{
		id: "business_tax_preparation",
		name: "Business Tax Preparation",
		description: "Corporate tax return preparation and compliance",
		category: "Tax Services",
		basePrice: 35000,
		estimatedDuration: "10-14 business days",
		requirements: [
			"Financial statements",
			"Business registration",
			"Bank statements",
		],
		features: [
			"Corporate tax filing",
			"Expense optimization",
			"Compliance review",
			"Tax planning",
		],
	},
	{
		id: "bookkeeping",
		name: "Monthly Bookkeeping",
		description: "Professional bookkeeping and accounting services",
		category: "Accounting",
		basePrice: 8000,
		estimatedDuration: "Ongoing monthly",
		requirements: [
			"Bank statements",
			"Receipts and invoices",
			"Previous records",
		],
		features: [
			"Monthly reports",
			"Expense tracking",
			"Reconciliation",
			"Digital records",
		],
	},
	{
		id: "business_registration",
		name: "Business Registration",
		description: "Complete business registration and incorporation",
		category: "Legal Services",
		basePrice: 25000,
		estimatedDuration: "15-20 business days",
		requirements: ["ID documents", "Business plan", "Proposed name"],
		features: [
			"Name reservation",
			"Legal documentation",
			"Registration filing",
			"Post-registration support",
		],
	},
	{
		id: "compliance_audit",
		name: "Compliance Audit",
		description: "Comprehensive review of regulatory compliance",
		category: "Compliance",
		basePrice: 45000,
		estimatedDuration: "20-30 business days",
		requirements: [
			"All business records",
			"Previous filings",
			"Current operations info",
		],
		features: [
			"Full compliance review",
			"Risk assessment",
			"Remediation plan",
			"Ongoing support",
		],
	},
	{
		id: "payroll_services",
		name: "Payroll Management",
		description: "Complete payroll processing and NIS compliance",
		category: "HR Services",
		basePrice: 12000,
		estimatedDuration: "Monthly processing",
		requirements: [
			"Employee information",
			"Salary details",
			"Previous payroll records",
		],
		features: [
			"Salary processing",
			"NIS calculations",
			"Tax deductions",
			"Payroll reports",
		],
	},
];

// Validation schemas
const serviceSelectionSchema = z.object({
	selectedServices: z
		.array(z.string())
		.min(1, "Please select at least one service"),
	priority: z.enum(["standard", "urgent", "emergency"]).default("standard"),
	preferredStartDate: z.string().optional(),
	specialRequirements: z.string().optional(),
});

const clientDetailsSchema = z.object({
	isExistingClient: z.boolean().default(false),
	clientId: z.string().optional(),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Valid email is required"),
	phone: z.string().min(1, "Phone number is required"),
	company: z.string().optional(),
	address: z.string().min(1, "Address is required"),
});

const requirementsSchema = z.object({
	documentsAvailable: z.record(z.boolean()).optional(),
	additionalNotes: z.string().optional(),
	communicationPreference: z
		.enum(["email", "phone", "whatsapp", "in_person"])
		.default("email"),
	scheduledMeetingRequired: z.boolean().default(false),
	meetingDate: z.string().optional(),
	meetingTime: z.string().optional(),
});

const pricingSchema = z.object({
	agreedToEstimate: z
		.boolean()
		.refine((val) => val, "Must agree to pricing estimate"),
	paymentMethod: z.enum(["bank_transfer", "cash", "check", "card"]),
	paymentSchedule: z
		.enum(["full_upfront", "50_50", "monthly"])
		.default("50_50"),
	additionalServices: z.array(z.string()).optional(),
});

// Step 1: Service Selection
function ServiceSelectionStep() {
	const [data, setData] = useStepData("service-selection");
	const [selectedServices, setSelectedServices] = useState<string[]>(
		data.selectedServices || [],
	);

	const handleServiceToggle = (serviceId: string) => {
		const updated = selectedServices.includes(serviceId)
			? selectedServices.filter((id) => id !== serviceId)
			: [...selectedServices, serviceId];

		setSelectedServices(updated);
		setData({ ...data, selectedServices: updated });
	};

	const handleChange = (field: string, value: any) => {
		setData({ ...data, [field]: value });
	};

	const calculateTotalPrice = () => {
		return selectedServices.reduce((total, serviceId) => {
			const service = availableServices.find((s) => s.id === serviceId);
			return total + (service?.basePrice || 0);
		}, 0);
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Available Services
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{availableServices.map((service) => (
							<Card
								key={service.id}
								className={`cursor-pointer transition-all hover:shadow-md ${
									selectedServices.includes(service.id)
										? "bg-blue-50 ring-2 ring-blue-500"
										: ""
								} ${service.recommended ? "border-green-500" : ""}`}
								onClick={() => handleServiceToggle(service.id)}
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="flex items-center gap-2 text-base">
												{service.recommended && (
													<Star className="h-4 w-4 fill-current text-yellow-500" />
												)}
												{service.name}
											</CardTitle>
											<p className="mt-1 text-gray-600 text-sm">
												{service.category}
											</p>
										</div>
										<Checkbox
											checked={selectedServices.includes(service.id)}
											onChange={() => {}} // Handled by card click
										/>
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<p className="mb-3 text-gray-700 text-sm">
										{service.description}
									</p>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Price:</span>
											<span className="font-semibold">
												${service.basePrice.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Duration:</span>
											<span>{service.estimatedDuration}</span>
										</div>
									</div>
									<div className="mt-3">
										<p className="mb-1 text-gray-600 text-xs">Key Features:</p>
										<ul className="list-inside list-disc text-gray-700 text-xs">
											{service.features.slice(0, 2).map((feature, idx) => (
												<li key={idx}>{feature}</li>
											))}
											{service.features.length > 2 && (
												<li>+{service.features.length - 2} more...</li>
											)}
										</ul>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{selectedServices.length > 0 && (
						<Card className="mt-6 border-green-200 bg-green-50">
							<CardContent className="pt-6">
								<h4 className="mb-2 font-semibold text-green-900">
									Selected Services Summary
								</h4>
								<div className="space-y-1">
									{selectedServices.map((serviceId) => {
										const service = availableServices.find(
											(s) => s.id === serviceId,
										);
										return service ? (
											<div
												key={serviceId}
												className="flex justify-between text-sm"
											>
												<span>{service.name}</span>
												<span>${service.basePrice.toLocaleString()}</span>
											</div>
										) : null;
									})}
									<div className="mt-2 border-green-300 border-t pt-2">
										<div className="flex justify-between font-semibold">
											<span>Total Estimated Cost:</span>
											<span>${calculateTotalPrice().toLocaleString()}</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Service Preferences</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="priority">Service Priority</Label>
						<Select
							value={data.priority || "standard"}
							onValueChange={(value) => handleChange("priority", value)}
						>
							<SelectTrigger className="mt-2">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="standard">Standard (No rush)</SelectItem>
								<SelectItem value="urgent">Urgent (+25% fee)</SelectItem>
								<SelectItem value="emergency">Emergency (+50% fee)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="preferredStartDate">Preferred Start Date</Label>
						<Input
							id="preferredStartDate"
							type="date"
							value={data.preferredStartDate || ""}
							onChange={(e) =>
								handleChange("preferredStartDate", e.target.value)
							}
							className="mt-2"
						/>
					</div>

					<div>
						<Label htmlFor="specialRequirements">Special Requirements</Label>
						<Textarea
							id="specialRequirements"
							placeholder="Any special requirements or notes..."
							value={data.specialRequirements || ""}
							onChange={(e) =>
								handleChange("specialRequirements", e.target.value)
							}
							className="mt-2"
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Step 2: Client Details
function ClientDetailsStep() {
	const [data, setData] = useStepData("client-details");

	const handleChange = (field: string, value: any) => {
		setData({ ...data, [field]: value });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="h-5 w-5" />
					Client Information
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						checked={data.isExistingClient || false}
						onCheckedChange={(checked) =>
							handleChange("isExistingClient", checked)
						}
					/>
					<Label>I am an existing client</Label>
				</div>

				{data.isExistingClient && (
					<div>
						<Label htmlFor="clientId">Client ID</Label>
						<Input
							id="clientId"
							placeholder="Enter your client ID"
							value={data.clientId || ""}
							onChange={(e) => handleChange("clientId", e.target.value)}
							className="mt-2"
						/>
					</div>
				)}

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="firstName">First Name</Label>
						<Input
							id="firstName"
							placeholder="John"
							value={data.firstName || ""}
							onChange={(e) => handleChange("firstName", e.target.value)}
							className="mt-2"
						/>
					</div>
					<div>
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							placeholder="Doe"
							value={data.lastName || ""}
							onChange={(e) => handleChange("lastName", e.target.value)}
							className="mt-2"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							placeholder="john.doe@example.com"
							value={data.email || ""}
							onChange={(e) => handleChange("email", e.target.value)}
							className="mt-2"
						/>
					</div>
					<div>
						<Label htmlFor="phone">Phone Number</Label>
						<Input
							id="phone"
							placeholder="+592-xxx-xxxx"
							value={data.phone || ""}
							onChange={(e) => handleChange("phone", e.target.value)}
							className="mt-2"
						/>
					</div>
				</div>

				<div>
					<Label htmlFor="company">Company/Organization (Optional)</Label>
					<Input
						id="company"
						placeholder="ACME Corporation"
						value={data.company || ""}
						onChange={(e) => handleChange("company", e.target.value)}
						className="mt-2"
					/>
				</div>

				<div>
					<Label htmlFor="address">Address</Label>
					<Textarea
						id="address"
						placeholder="Enter your full address"
						value={data.address || ""}
						onChange={(e) => handleChange("address", e.target.value)}
						className="mt-2"
						rows={3}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

// Step 3: Requirements and Communication
function RequirementsStep() {
	const [data, setData] = useStepData("requirements");
	const [serviceData] = useStepData("service-selection");

	const handleChange = (field: string, value: any) => {
		setData({ ...data, [field]: value });
	};

	const handleDocumentCheck = (document: string, checked: boolean) => {
		const current = data.documentsAvailable || {};
		setData({
			...data,
			documentsAvailable: { ...current, [document]: checked },
		});
	};

	// Get required documents for selected services
	const getRequiredDocuments = () => {
		const selectedServices = serviceData.selectedServices || [];
		const documents = new Set<string>();

		selectedServices.forEach((serviceId: string) => {
			const service = availableServices.find((s) => s.id === serviceId);
			service?.requirements.forEach((req) => documents.add(req));
		});

		return Array.from(documents);
	};

	const requiredDocuments = getRequiredDocuments();

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Required Documents
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4 text-gray-600 text-sm">
						Please confirm which documents you have available for the selected
						services.
					</p>
					<div className="space-y-3">
						{requiredDocuments.map((document) => (
							<div key={document} className="flex items-center space-x-2">
								<Checkbox
									checked={data.documentsAvailable?.[document] || false}
									onCheckedChange={(checked) =>
										handleDocumentCheck(document, checked as boolean)
									}
								/>
								<Label className="text-sm">{document}</Label>
							</div>
						))}
					</div>

					<div className="mt-6">
						<Label htmlFor="additionalNotes">Additional Notes</Label>
						<Textarea
							id="additionalNotes"
							placeholder="Any additional information about your documents or requirements..."
							value={data.additionalNotes || ""}
							onChange={(e) => handleChange("additionalNotes", e.target.value)}
							className="mt-2"
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Communication Preferences</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Preferred Communication Method</Label>
						<Select
							value={data.communicationPreference || "email"}
							onValueChange={(value) =>
								handleChange("communicationPreference", value)
							}
						>
							<SelectTrigger className="mt-2">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="email">Email</SelectItem>
								<SelectItem value="phone">Phone</SelectItem>
								<SelectItem value="whatsapp">WhatsApp</SelectItem>
								<SelectItem value="in_person">In-Person Meeting</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							checked={data.scheduledMeetingRequired || false}
							onCheckedChange={(checked) =>
								handleChange("scheduledMeetingRequired", checked)
							}
						/>
						<Label>Schedule initial consultation meeting</Label>
					</div>

					{data.scheduledMeetingRequired && (
						<div className="grid grid-cols-1 gap-4 pl-6 md:grid-cols-2">
							<div>
								<Label htmlFor="meetingDate">Preferred Meeting Date</Label>
								<Input
									id="meetingDate"
									type="date"
									value={data.meetingDate || ""}
									onChange={(e) => handleChange("meetingDate", e.target.value)}
									className="mt-2"
								/>
							</div>
							<div>
								<Label htmlFor="meetingTime">Preferred Time</Label>
								<Select
									value={data.meetingTime || ""}
									onValueChange={(value) => handleChange("meetingTime", value)}
								>
									<SelectTrigger className="mt-2">
										<SelectValue placeholder="Select time" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="9:00">9:00 AM</SelectItem>
										<SelectItem value="10:00">10:00 AM</SelectItem>
										<SelectItem value="11:00">11:00 AM</SelectItem>
										<SelectItem value="14:00">2:00 PM</SelectItem>
										<SelectItem value="15:00">3:00 PM</SelectItem>
										<SelectItem value="16:00">4:00 PM</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// Step 4: Pricing and Payment
function PricingStep() {
	const [data, setData] = useStepData("pricing");
	const [serviceData] = useStepData("service-selection");

	const handleChange = (field: string, value: any) => {
		setData({ ...data, [field]: value });
	};

	const calculateTotal = () => {
		const selectedServices = serviceData.selectedServices || [];
		let total = selectedServices.reduce((sum: number, serviceId: string) => {
			const service = availableServices.find((s) => s.id === serviceId);
			return sum + (service?.basePrice || 0);
		}, 0);

		// Apply priority fee
		if (serviceData.priority === "urgent") total *= 1.25;
		if (serviceData.priority === "emergency") total *= 1.5;

		return total;
	};

	const total = calculateTotal();

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Pricing Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{(serviceData.selectedServices || []).map((serviceId: string) => {
							const service = availableServices.find((s) => s.id === serviceId);
							return service ? (
								<div key={serviceId} className="flex justify-between">
									<span>{service.name}</span>
									<span>${service.basePrice.toLocaleString()}</span>
								</div>
							) : null;
						})}

						{serviceData.priority !== "standard" && (
							<div className="flex justify-between text-orange-600">
								<span>
									{serviceData.priority === "urgent" ? "Urgent" : "Emergency"}{" "}
									Fee
								</span>
								<span>
									+{serviceData.priority === "urgent" ? "25%" : "50%"}
								</span>
							</div>
						)}

						<div className="border-t pt-3 font-semibold text-lg">
							<div className="flex justify-between">
								<span>Total:</span>
								<span>${total.toLocaleString()}</span>
							</div>
						</div>
					</div>

					<div className="mt-6 flex items-center space-x-2">
						<Checkbox
							checked={data.agreedToEstimate || false}
							onCheckedChange={(checked) =>
								handleChange("agreedToEstimate", checked)
							}
						/>
						<Label>I agree to the pricing estimate above</Label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Payment Options</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Payment Method</Label>
						<Select
							value={data.paymentMethod || ""}
							onValueChange={(value) => handleChange("paymentMethod", value)}
						>
							<SelectTrigger className="mt-2">
								<SelectValue placeholder="Select payment method" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
								<SelectItem value="cash">Cash</SelectItem>
								<SelectItem value="check">Check</SelectItem>
								<SelectItem value="card">Credit/Debit Card</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>Payment Schedule</Label>
						<Select
							value={data.paymentSchedule || "50_50"}
							onValueChange={(value) => handleChange("paymentSchedule", value)}
						>
							<SelectTrigger className="mt-2">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="full_upfront">
									Full Payment Upfront
								</SelectItem>
								<SelectItem value="50_50">
									50% Upfront, 50% on Completion
								</SelectItem>
								<SelectItem value="monthly">Monthly Installments</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

const wizardSteps: WizardStep[] = [
	{
		id: "service-selection",
		title: "Select Services",
		description: "Choose the services you need",
		icon: <Settings className="h-6 w-6" />,
		validation: serviceSelectionSchema,
		component: ServiceSelectionStep,
	},
	{
		id: "client-details",
		title: "Client Details",
		description: "Your contact information",
		icon: <User className="h-6 w-6" />,
		validation: clientDetailsSchema,
		component: ClientDetailsStep,
	},
	{
		id: "requirements",
		title: "Requirements",
		description: "Documents and communication",
		icon: <FileText className="h-6 w-6" />,
		validation: requirementsSchema,
		component: RequirementsStep,
	},
	{
		id: "pricing",
		title: "Pricing & Payment",
		description: "Review pricing and payment options",
		icon: <CreditCard className="h-6 w-6" />,
		validation: pricingSchema,
		component: PricingStep,
	},
];

interface ServiceRequestWizardProps {
	onComplete?: (data: any) => Promise<void>;
	onExit?: () => void;
}

export function ServiceRequestWizard({
	onComplete,
	onExit,
}: ServiceRequestWizardProps) {
	const handleSave = async (data: any, sessionId: string) => {
		localStorage.setItem(`service-wizard-${sessionId}`, JSON.stringify(data));
	};

	const handleLoad = async (sessionId: string) => {
		const saved = localStorage.getItem(`service-wizard-${sessionId}`);
		return saved ? JSON.parse(saved) : null;
	};

	return (
		<WizardProvider
			steps={wizardSteps}
			onComplete={onComplete}
			onSave={handleSave}
			onLoad={handleLoad}
		>
			<WizardLayout
				title="Service Request"
				subtitle="Request professional business services from GCMC-KAJ"
				onExit={onExit}
			>
				<ServiceRequestWizardContent />
			</WizardLayout>
		</WizardProvider>
	);
}

function ServiceRequestWizardContent() {
	const { currentStep } = useWizard();
	const StepComponent = currentStep.component;
	return <StepComponent />;
}
