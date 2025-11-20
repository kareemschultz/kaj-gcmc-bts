"use client";

import {
	BookOpen,
	FileQuestion,
	HelpCircle,
	MessageSquare,
	Phone,
	Plus,
	Search,
	Video,
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface ClientSupportProps {
	user: User;
}

const faqItems = [
	{
		category: "Getting Started",
		questions: [
			{
				question: "How do I upload documents to my account?",
				answer:
					"You can upload documents by navigating to the Documents section and clicking 'Upload Document'. Drag and drop files or click to browse and select files from your device. Supported formats include PDF, DOC, DOCX, XLS, XLSX, JPG, and PNG.",
			},
			{
				question: "How do I view my compliance score?",
				answer:
					"Your compliance score is displayed on the main dashboard and in the Compliance section. The score is calculated based on completed requirements, document submissions, and filing deadlines.",
			},
			{
				question: "How can I contact my advisor?",
				answer:
					"You can contact your advisor through the Messages section, where you can start a new conversation or continue existing discussions. You can also schedule calls or meetings through the Calendar section.",
			},
		],
	},
	{
		category: "Billing & Payments",
		questions: [
			{
				question: "How do I make a payment?",
				answer:
					"Go to the Payments section to view outstanding invoices. Click 'Pay Now' on any pending invoice to process payment using your saved payment methods or add a new one.",
			},
			{
				question: "Can I set up automatic payments?",
				answer:
					"Yes, you can enable automatic payments in your Payment Methods settings. This will automatically charge your default payment method when invoices are due.",
			},
			{
				question: "Where can I download my receipts?",
				answer:
					"All paid invoices and receipts are available in the Payments section. Click on any completed payment to download the receipt in PDF format.",
			},
		],
	},
	{
		category: "Compliance & Filing",
		questions: [
			{
				question: "What documents do I need for tax filing?",
				answer:
					"Required documents typically include income statements, expense receipts, previous tax returns, and business registration documents. Your advisor will provide a specific checklist based on your business type and requirements.",
			},
			{
				question: "How do I track filing deadlines?",
				answer:
					"The Calendar section displays all upcoming deadlines, with color-coded priority levels. You'll also receive email and in-app notifications for approaching deadlines.",
			},
			{
				question: "What happens if I miss a deadline?",
				answer:
					"Contact your advisor immediately if you anticipate missing a deadline. We can often request extensions or help minimize penalties through proper filing procedures.",
			},
		],
	},
];

const supportChannels = [
	{
		title: "Live Chat",
		description: "Chat with our support team in real-time",
		icon: MessageSquare,
		availability: "Monday-Friday, 9 AM - 6 PM",
		responseTime: "< 5 minutes",
		color: "bg-blue-100 text-blue-600",
	},
	{
		title: "Phone Support",
		description: "Speak directly with a support representative",
		icon: Phone,
		availability: "Monday-Friday, 8 AM - 7 PM",
		responseTime: "Immediate",
		color: "bg-green-100 text-green-600",
	},
	{
		title: "Video Call",
		description: "Schedule a video consultation with your advisor",
		icon: Video,
		availability: "By appointment",
		responseTime: "Within 24 hours",
		color: "bg-purple-100 text-purple-600",
	},
	{
		title: "Knowledge Base",
		description: "Browse our comprehensive help articles",
		icon: BookOpen,
		availability: "24/7",
		responseTime: "Self-service",
		color: "bg-orange-100 text-orange-600",
	},
];

export function ClientSupport({ user }: ClientSupportProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
	const [ticketData, setTicketData] = useState({
		subject: "",
		category: "",
		priority: "",
		description: "",
	});

	// Filter FAQ items based on search
	const filteredFAQ = faqItems
		.map((category) => ({
			...category,
			questions: category.questions.filter(
				(item) =>
					item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
					item.answer.toLowerCase().includes(searchTerm.toLowerCase()),
			),
		}))
		.filter((category) => category.questions.length > 0);

	const handleTicketSubmit = () => {
		// Submit support ticket
		console.log("Submitting ticket:", ticketData);
		setTicketDialogOpen(false);
		setTicketData({ subject: "", category: "", priority: "", description: "" });
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Support & Help</h1>
					<p className="text-muted-foreground">
						Get help with your account, find answers, and contact our support
						team
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Create Support Ticket
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Create Support Ticket</DialogTitle>
								<DialogDescription>
									Describe your issue and our team will get back to you soon
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="subject">Subject</Label>
									<Input
										id="subject"
										placeholder="Brief description of your issue"
										value={ticketData.subject}
										onChange={(e) =>
											setTicketData((prev) => ({
												...prev,
												subject: e.target.value,
											}))
										}
									/>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="category">Category</Label>
										<select
											id="category"
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={ticketData.category}
											onChange={(e) =>
												setTicketData((prev) => ({
													...prev,
													category: e.target.value,
												}))
											}
										>
											<option value="">Select category</option>
											<option value="billing">Billing & Payments</option>
											<option value="technical">Technical Issues</option>
											<option value="compliance">Compliance Questions</option>
											<option value="documents">Document Management</option>
											<option value="general">General Inquiry</option>
										</select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="priority">Priority</Label>
										<select
											id="priority"
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={ticketData.priority}
											onChange={(e) =>
												setTicketData((prev) => ({
													...prev,
													priority: e.target.value,
												}))
											}
										>
											<option value="">Select priority</option>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
											<option value="urgent">Urgent</option>
										</select>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										placeholder="Please provide detailed information about your issue"
										rows={6}
										value={ticketData.description}
										onChange={(e) =>
											setTicketData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
									/>
								</div>
								<div className="flex justify-end space-x-2">
									<Button
										variant="outline"
										onClick={() => setTicketDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button onClick={handleTicketSubmit}>Submit Ticket</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Support Channels */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{supportChannels.map((channel, index) => {
					const Icon = channel.icon;
					return (
						<Card
							key={index}
							className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
						>
							<CardContent className="p-6">
								<div className="space-y-4">
									<div
										className={`inline-flex rounded-lg p-3 ${channel.color}`}
									>
										<Icon className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-semibold">{channel.title}</h3>
										<p className="text-muted-foreground text-sm">
											{channel.description}
										</p>
									</div>
									<div className="space-y-1 text-muted-foreground text-xs">
										<p>Available: {channel.availability}</p>
										<p>Response: {channel.responseTime}</p>
									</div>
									<Button variant="outline" className="w-full">
										{channel.title === "Knowledge Base"
											? "Browse Articles"
											: "Contact Now"}
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Main Content */}
			<Tabs defaultValue="faq" className="space-y-6">
				<TabsList>
					<TabsTrigger value="faq">Frequently Asked Questions</TabsTrigger>
					<TabsTrigger value="guides">Guides & Tutorials</TabsTrigger>
					<TabsTrigger value="contact">Contact Information</TabsTrigger>
				</TabsList>

				<TabsContent value="faq" className="space-y-6">
					{/* Search */}
					<Card>
						<CardContent className="p-6">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search frequently asked questions..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</CardContent>
					</Card>

					{/* FAQ Categories */}
					<div className="space-y-6">
						{filteredFAQ.map((category, categoryIndex) => (
							<Card key={categoryIndex}>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<HelpCircle className="h-5 w-5 text-blue-600" />
										{category.category}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{category.questions.map((item, itemIndex) => (
											<div key={itemIndex} className="space-y-2">
												<h4 className="font-medium text-sm">{item.question}</h4>
												<p className="text-muted-foreground text-sm leading-relaxed">
													{item.answer}
												</p>
												{itemIndex < category.questions.length - 1 && (
													<div className="border-b pt-2" />
												)}
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="guides" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[
							{
								title: "Getting Started Guide",
								description: "Learn the basics of using your client portal",
								duration: "5 min read",
								badge: "New User",
							},
							{
								title: "Document Upload Tutorial",
								description:
									"Step-by-step guide to uploading and organizing documents",
								duration: "3 min read",
								badge: "Popular",
							},
							{
								title: "Understanding Compliance Scores",
								description:
									"Learn how compliance scores are calculated and what they mean",
								duration: "7 min read",
								badge: "Important",
							},
							{
								title: "Payment & Billing Guide",
								description:
									"Manage payments, view invoices, and set up auto-pay",
								duration: "4 min read",
								badge: "Finance",
							},
							{
								title: "Calendar & Deadlines",
								description:
									"Stay on top of important filing dates and appointments",
								duration: "3 min read",
								badge: "Compliance",
							},
							{
								title: "Messaging Your Advisor",
								description:
									"Best practices for communicating with your advisor",
								duration: "2 min read",
								badge: "Communication",
							},
						].map((guide, index) => (
							<Card
								key={index}
								className="transition-all duration-200 hover:shadow-lg"
							>
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-start justify-between">
											<Badge variant="outline">{guide.badge}</Badge>
											<span className="text-muted-foreground text-xs">
												{guide.duration}
											</span>
										</div>
										<div>
											<h3 className="font-semibold">{guide.title}</h3>
											<p className="text-muted-foreground text-sm">
												{guide.description}
											</p>
										</div>
										<Button variant="outline" className="w-full">
											Read Guide
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="contact" className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Contact Methods */}
						<Card>
							<CardHeader>
								<CardTitle>Contact Methods</CardTitle>
								<CardDescription>
									Multiple ways to get in touch with our team
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center space-x-4">
									<div className="rounded-lg bg-blue-100 p-3">
										<Phone className="h-6 w-6 text-blue-600" />
									</div>
									<div>
										<h4 className="font-medium">Phone Support</h4>
										<p className="text-muted-foreground text-sm">
											+592-555-GCMC (4262)
										</p>
										<p className="text-muted-foreground text-xs">
											Mon-Fri, 8 AM - 7 PM
										</p>
									</div>
								</div>

								<div className="flex items-center space-x-4">
									<div className="rounded-lg bg-green-100 p-3">
										<MessageSquare className="h-6 w-6 text-green-600" />
									</div>
									<div>
										<h4 className="font-medium">Live Chat</h4>
										<p className="text-muted-foreground text-sm">
											Available on this portal
										</p>
										<p className="text-muted-foreground text-xs">
											Mon-Fri, 9 AM - 6 PM
										</p>
									</div>
								</div>

								<div className="flex items-center space-x-4">
									<div className="rounded-lg bg-purple-100 p-3">
										<Video className="h-6 w-6 text-purple-600" />
									</div>
									<div>
										<h4 className="font-medium">Video Consultation</h4>
										<p className="text-muted-foreground text-sm">
											Schedule through calendar
										</p>
										<p className="text-muted-foreground text-xs">
											By appointment
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Office Information */}
						<Card>
							<CardHeader>
								<CardTitle>Office Information</CardTitle>
								<CardDescription>
									Visit us at our Georgetown location
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="font-medium">
										GCMC-KAJ Business Tax Services
									</h4>
									<p className="text-muted-foreground text-sm">
										123 Main Street
										<br />
										Georgetown, Demerara-Mahaica
										<br />
										Guyana
									</p>
								</div>

								<div className="space-y-2">
									<h4 className="font-medium">Business Hours</h4>
									<div className="text-muted-foreground text-sm">
										<p>Monday - Friday: 8:00 AM - 6:00 PM</p>
										<p>Saturday: 9:00 AM - 2:00 PM</p>
										<p>Sunday: Closed</p>
									</div>
								</div>

								<Button variant="outline" className="w-full">
									Get Directions
								</Button>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
