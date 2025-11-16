"use client";

import { CheckCircle, FileText, Settings, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";

interface TeamMember {
	name: string;
	email: string;
	role: string;
	department?: string;
}

const COMPLIANCE_ROLES = [
	{
		value: "ComplianceManager",
		label: "Compliance Manager",
		description: "Oversees compliance operations and team",
	},
	{
		value: "ComplianceOfficer",
		label: "Compliance Officer",
		description: "Handles daily compliance tasks and filings",
	},
	{
		value: "DocumentOfficer",
		label: "Document Officer",
		description: "Manages document uploads and organization",
	},
	{
		value: "FilingClerk",
		label: "Filing Clerk",
		description: "Prepares and submits regulatory filings",
	},
	{
		value: "Viewer",
		label: "Viewer",
		description: "Read-only access to compliance data",
	},
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
	const [currentStep, setCurrentStep] = useState(1);
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [newMember, setNewMember] = useState<TeamMember>({
		name: "",
		email: "",
		role: "Viewer",
		department: "",
	});
	const [organizationName, setOrganizationName] = useState("");
	const [complianceNeeds, setComplianceNeeds] = useState("");
	const [showInviteDialog, setShowInviteDialog] = useState(false);

	const { data: roles } = trpc.roles.list.useQuery();
	const utils = trpc.useUtils();

	const addTeamMember = () => {
		if (newMember.name && newMember.email && newMember.role) {
			setTeamMembers([...teamMembers, newMember]);
			setNewMember({
				name: "",
				email: "",
				role: "Viewer",
				department: "",
			});
			setShowInviteDialog(false);
			toast.success("Team member added to invite list");
		}
	};

	const removeTeamMember = (index: number) => {
		setTeamMembers(teamMembers.filter((_, i) => i !== index));
	};

	const steps = [
		{
			title: "Welcome to GCMC-KAJ",
			description: "Let's set up your compliance management platform",
			icon: <Settings className="h-8 w-8 text-primary" />,
		},
		{
			title: "Organization Setup",
			description: "Configure your organization details",
			icon: <FileText className="h-8 w-8 text-primary" />,
		},
		{
			title: "Team Setup",
			description: "Invite your compliance team members",
			icon: <Users className="h-8 w-8 text-primary" />,
		},
		{
			title: "Ready to Go!",
			description: "Your platform is configured and ready",
			icon: <CheckCircle className="h-8 w-8 text-green-500" />,
		},
	];

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								{steps[0].icon}
								{steps[0].title}
							</CardTitle>
							<CardDescription>{steps[0].description}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg bg-blue-50 p-4">
								<h3 className="font-semibold text-blue-900">
									🎉 Welcome to Your Compliance Platform!
								</h3>
								<p className="mt-2 text-blue-800">
									This wizard will help you set up your organization and invite
									your team members. You can skip any step and return later.
								</p>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">✅ What's Already Done</h4>
									<ul className="mt-2 space-y-1 text-muted-foreground text-sm">
										<li>• Your admin account is active</li>
										<li>• All compliance roles are configured</li>
										<li>• Database and security are set up</li>
									</ul>
								</div>
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">🚀 What We'll Set Up</h4>
									<ul className="mt-2 space-y-1 text-muted-foreground text-sm">
										<li>• Organization details</li>
										<li>• Team member roles</li>
										<li>• Initial compliance workflow</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				);

			case 2:
				return (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								{steps[1].icon}
								{steps[1].title}
							</CardTitle>
							<CardDescription>{steps[1].description}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="org-name">Organization Name</Label>
								<Input
									id="org-name"
									value={organizationName}
									onChange={(e) => setOrganizationName(e.target.value)}
									placeholder="e.g., ACME Financial Services"
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="compliance-needs">
									Primary Compliance Needs (Optional)
								</Label>
								<Textarea
									id="compliance-needs"
									value={complianceNeeds}
									onChange={(e) => setComplianceNeeds(e.target.value)}
									placeholder="e.g., SEC filings, regulatory reporting, document management..."
									className="mt-1"
									rows={3}
								/>
							</div>
							<div className="rounded-lg bg-amber-50 p-4">
								<p className="text-amber-800 text-sm">
									💡 You can update these settings anytime in the organization
									settings page.
								</p>
							</div>
						</CardContent>
					</Card>
				);

			case 3:
				return (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								{steps[2].icon}
								{steps[2].title}
							</CardTitle>
							<CardDescription>
								Invite your compliance team members and assign their roles
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between">
								<h4 className="font-medium text-lg">Team Members</h4>
								<Button
									onClick={() => setShowInviteDialog(true)}
									className="flex items-center gap-2"
								>
									<UserPlus className="h-4 w-4" />
									Invite Member
								</Button>
							</div>

							{teamMembers.length === 0 ? (
								<div className="rounded-lg border-2 border-dashed p-8 text-center">
									<UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
									<h4 className="mt-4 font-medium">No team members yet</h4>
									<p className="text-muted-foreground">
										Add team members to get started with collaboration
									</p>
									<Button
										onClick={() => setShowInviteDialog(true)}
										className="mt-4"
										variant="outline"
									>
										Invite Your First Team Member
									</Button>
								</div>
							) : (
								<div className="space-y-2">
									{teamMembers.map((member, index) => (
										<div
											key={index}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div>
												<p className="font-medium">{member.name}</p>
												<p className="text-muted-foreground text-sm">
													{member.email} • {member.role}
												</p>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeTeamMember(index)}
											>
												Remove
											</Button>
										</div>
									))}
								</div>
							)}

							<div className="rounded-lg bg-green-50 p-4">
								<h4 className="font-medium text-green-900">
									Role Descriptions
								</h4>
								<div className="mt-2 grid gap-2 text-sm">
									{COMPLIANCE_ROLES.map((role) => (
										<div key={role.value} className="text-green-800">
											<strong>{role.label}:</strong> {role.description}
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				);

			case 4:
				return (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								{steps[3].icon}
								{steps[3].title}
							</CardTitle>
							<CardDescription>{steps[3].description}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg bg-green-50 p-6 text-center">
								<CheckCircle className="mx-auto h-16 w-16 text-green-500" />
								<h3 className="mt-4 font-semibold text-green-900 text-xl">
									🎉 Setup Complete!
								</h3>
								<p className="mt-2 text-green-800">
									Your compliance platform is ready. Here's what happens next:
								</p>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">📧 Team Invites</h4>
									<p className="mt-1 text-muted-foreground text-sm">
										{teamMembers.length > 0
											? `${teamMembers.length} team members will be notified via email`
											: "Add team members anytime from /admin/users"}
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">🚀 Quick Start</h4>
									<p className="mt-1 text-muted-foreground text-sm">
										Start by exploring the dashboard and uploading your first
										compliance documents
									</p>
								</div>
							</div>

							<div className="rounded-lg bg-blue-50 p-4">
								<h4 className="font-medium text-blue-900">📚 Next Steps</h4>
								<ul className="mt-2 space-y-1 text-blue-800 text-sm">
									<li>• Visit your dashboard to see compliance overview</li>
									<li>• Go to /admin/users to manage team permissions</li>
									<li>
										• Upload initial documents and start tracking compliance
									</li>
									<li>• Set up automated workflows and notifications</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				);
		}
	};

	return (
		<div className="mx-auto max-w-4xl p-6">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">Platform Setup</h1>
						<p className="text-muted-foreground">
							Step {currentStep} of {steps.length}
						</p>
					</div>
					<div className="text-right text-muted-foreground text-sm">
						<p>Admin: test1@example.com</p>
						<p>Role: FirmAdmin</p>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="mt-6 flex items-center space-x-4">
					{steps.map((step, index) => (
						<div key={index} className="flex items-center">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
									index + 1 <= currentStep
										? "border-primary bg-primary text-primary-foreground"
										: "border-muted-foreground text-muted-foreground"
								}`}
							>
								{index + 1 <= currentStep ? (
									<CheckCircle className="h-5 w-5" />
								) : (
									<span>{index + 1}</span>
								)}
							</div>
							{index < steps.length - 1 && (
								<div
									className={`h-0.5 w-16 ${
										index + 1 < currentStep ? "bg-primary" : "bg-muted"
									}`}
								/>
							)}
						</div>
					))}
				</div>
			</div>

			{renderStep()}

			<div className="mt-8 flex justify-between">
				<Button
					variant="outline"
					onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
					disabled={currentStep === 1}
				>
					Previous
				</Button>
				<div className="flex gap-2">
					<Button variant="ghost" onClick={onComplete}>
						Skip Setup
					</Button>
					{currentStep < steps.length ? (
						<Button
							onClick={() =>
								setCurrentStep(Math.min(steps.length, currentStep + 1))
							}
						>
							Next
						</Button>
					) : (
						<Button onClick={onComplete}>Complete Setup</Button>
					)}
				</div>
			</div>

			{/* Invite Team Member Dialog */}
			<Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite Team Member</DialogTitle>
						<DialogDescription>
							Add a team member to your compliance organization
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="member-name">Full Name</Label>
							<Input
								id="member-name"
								value={newMember.name}
								onChange={(e) =>
									setNewMember({ ...newMember, name: e.target.value })
								}
								placeholder="John Doe"
							/>
						</div>
						<div>
							<Label htmlFor="member-email">Email Address</Label>
							<Input
								id="member-email"
								type="email"
								value={newMember.email}
								onChange={(e) =>
									setNewMember({ ...newMember, email: e.target.value })
								}
								placeholder="john.doe@company.com"
							/>
						</div>
						<div>
							<Label htmlFor="member-role">Role</Label>
							<Select
								value={newMember.role}
								onChange={(e) =>
									setNewMember({ ...newMember, role: e.target.value })
								}
							>
								{COMPLIANCE_ROLES.map((role) => (
									<option key={role.value} value={role.value}>
										{role.label}
									</option>
								))}
							</Select>
						</div>
						<div>
							<Label htmlFor="member-department">Department (Optional)</Label>
							<Input
								id="member-department"
								value={newMember.department}
								onChange={(e) =>
									setNewMember({ ...newMember, department: e.target.value })
								}
								placeholder="Compliance, Legal, Operations..."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowInviteDialog(false)}
						>
							Cancel
						</Button>
						<Button onClick={addTeamMember}>Add Member</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
