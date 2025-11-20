"use client";

import type {
	ClientContact,
	ClientRelationship,
	ClientRelationshipType,
	ContactRole,
} from "@gcmc-kaj/types";
import {
	Building,
	Calendar,
	ChevronDown,
	ChevronRight,
	Edit,
	ExternalLink,
	Link,
	Plus,
	Search,
	Trash2,
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
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ClientRelationshipsProps {
	clientId: number;
	relationships: ClientRelationship[];
	contacts: ClientContact[];
	onAddRelationship?: (relationship: Partial<ClientRelationship>) => void;
	onEditRelationship?: (
		id: string,
		relationship: Partial<ClientRelationship>,
	) => void;
	onDeleteRelationship?: (id: string) => void;
	onAddContact?: (contact: Partial<ClientContact>) => void;
	onEditContact?: (id: string, contact: Partial<ClientContact>) => void;
	onDeleteContact?: (id: string) => void;
	className?: string;
}

const RELATIONSHIP_ICONS = {
	subsidiary: Building,
	parent_company: Building,
	partner: Users,
	referral_source: Link,
	referred_by: Link,
	competitor: Building,
	vendor: Building,
	customer: Users,
	other: Link,
} as const;

const RELATIONSHIP_COLORS = {
	subsidiary: "bg-blue-100 text-blue-800",
	parent_company: "bg-green-100 text-green-800",
	partner: "bg-purple-100 text-purple-800",
	referral_source: "bg-orange-100 text-orange-800",
	referred_by: "bg-orange-100 text-orange-800",
	competitor: "bg-red-100 text-red-800",
	vendor: "bg-gray-100 text-gray-800",
	customer: "bg-indigo-100 text-indigo-800",
	other: "bg-gray-100 text-gray-800",
} as const;

const CONTACT_ROLE_COLORS = {
	primary: "bg-blue-100 text-blue-800",
	billing: "bg-green-100 text-green-800",
	technical: "bg-purple-100 text-purple-800",
	compliance: "bg-orange-100 text-orange-800",
	decision_maker: "bg-red-100 text-red-800",
	authorized_representative: "bg-indigo-100 text-indigo-800",
	other: "bg-gray-100 text-gray-800",
} as const;

export function ClientRelationships({
	clientId,
	relationships,
	contacts,
	onAddRelationship,
	onEditRelationship,
	onDeleteRelationship,
	onAddContact,
	onEditContact,
	onDeleteContact,
	className,
}: ClientRelationshipsProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["relationships"]),
	);
	const [showAddRelationshipDialog, setShowAddRelationshipDialog] =
		useState(false);
	const [showAddContactDialog, setShowAddContactDialog] = useState(false);

	// New relationship form state
	const [newRelationship, setNewRelationship] = useState<
		Partial<ClientRelationship>
	>({
		relationshipType: "partner",
		isActive: true,
	});

	// New contact form state
	const [newContact, setNewContact] = useState<Partial<ClientContact>>({
		role: "other",
		isPrimary: false,
		isActive: true,
	});

	const filteredRelationships = relationships.filter(
		(rel) =>
			rel.relatedEntityName
				?.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			rel.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			rel.relationshipType.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const filteredContacts = contacts.filter(
		(contact) =>
			contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			contact.role.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		setExpandedSections(newExpanded);
	};

	const handleAddRelationship = () => {
		if (
			onAddRelationship &&
			newRelationship.relatedEntityName &&
			newRelationship.relationshipType
		) {
			onAddRelationship({
				...newRelationship,
				clientId,
			});
			setNewRelationship({
				relationshipType: "partner",
				isActive: true,
			});
			setShowAddRelationshipDialog(false);
		}
	};

	const handleAddContact = () => {
		if (
			onAddContact &&
			newContact.name &&
			newContact.email &&
			newContact.role
		) {
			onAddContact({
				...newContact,
				clientId,
			});
			setNewContact({
				role: "other",
				isPrimary: false,
				isActive: true,
			});
			setShowAddContactDialog(false);
		}
	};

	const formatDate = (date?: Date): string => {
		if (!date) return "N/A";
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(new Date(date));
	};

	const getRelationshipIcon = (type: ClientRelationshipType) => {
		const Icon = RELATIONSHIP_ICONS[type] || Link;
		return Icon;
	};

	const getRelationshipColor = (type: ClientRelationshipType): string => {
		return RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.other;
	};

	const getContactRoleColor = (role: ContactRole): string => {
		return CONTACT_ROLE_COLORS[role] || CONTACT_ROLE_COLORS.other;
	};

	return (
		<TooltipProvider>
			<div className={cn("space-y-6", className)}>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-lg">Relationships & Contacts</h2>
						<p className="text-muted-foreground text-sm">
							Manage client relationships, contacts, and connections
						</p>
					</div>
					<div className="relative">
						<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search relationships and contacts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-80 pl-9"
						/>
					</div>
				</div>

				{/* Relationships Section */}
				<Card>
					<CardHeader
						className="cursor-pointer"
						onClick={() => toggleSection("relationships")}
					>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									{expandedSections.has("relationships") ? (
										<ChevronDown className="h-5 w-5" />
									) : (
										<ChevronRight className="h-5 w-5" />
									)}
									Business Relationships
									<Badge variant="secondary">
										{filteredRelationships.length}
									</Badge>
								</CardTitle>
								<CardDescription>
									Connected entities, partners, and business relationships
								</CardDescription>
							</div>
							<Dialog
								open={showAddRelationshipDialog}
								onOpenChange={setShowAddRelationshipDialog}
							>
								<DialogTrigger asChild>
									<Button size="sm" onClick={(e) => e.stopPropagation()}>
										<Plus className="mr-2 h-4 w-4" />
										Add Relationship
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add New Relationship</DialogTitle>
										<DialogDescription>
											Create a new business relationship or connection.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="entityName">Entity Name</Label>
												<Input
													id="entityName"
													placeholder="Entity or company name"
													value={newRelationship.relatedEntityName || ""}
													onChange={(e) =>
														setNewRelationship({
															...newRelationship,
															relatedEntityName: e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="relationshipType">
													Relationship Type
												</Label>
												<Select
													value={newRelationship.relationshipType}
													onValueChange={(value) =>
														setNewRelationship({
															...newRelationship,
															relationshipType: value as ClientRelationshipType,
														})
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{Object.keys(RELATIONSHIP_COLORS).map((type) => (
															<SelectItem key={type} value={type}>
																{type
																	.replace(/_/g, " ")
																	.replace(/\b\w/g, (c) => c.toUpperCase())}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="description">Description</Label>
											<Textarea
												id="description"
												placeholder="Brief description of the relationship"
												value={newRelationship.description || ""}
												onChange={(e) =>
													setNewRelationship({
														...newRelationship,
														description: e.target.value,
													})
												}
											/>
										</div>
										<div className="flex justify-end space-x-2">
											<Button
												variant="outline"
												onClick={() => setShowAddRelationshipDialog(false)}
											>
												Cancel
											</Button>
											<Button onClick={handleAddRelationship}>
												Add Relationship
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<Collapsible open={expandedSections.has("relationships")}>
						<CollapsibleContent>
							<CardContent className="pt-0">
								{filteredRelationships.length === 0 ? (
									<div className="py-8 text-center">
										<Users className="mx-auto h-12 w-12 text-muted-foreground" />
										<h3 className="mt-4 font-medium text-lg">
											No relationships found
										</h3>
										<p className="text-muted-foreground">
											{searchQuery
												? "No relationships match your search criteria."
												: "No business relationships have been established yet."}
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{filteredRelationships.map((relationship) => {
											const Icon = getRelationshipIcon(
												relationship.relationshipType,
											);
											return (
												<div
													key={relationship.id}
													className="flex items-center justify-between rounded-lg border p-4"
												>
													<div className="flex items-center space-x-4">
														<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
															<Icon className="h-5 w-5 text-gray-600" />
														</div>
														<div>
															<h4 className="font-medium">
																{relationship.relatedEntityName}
															</h4>
															<div className="flex items-center space-x-2 text-muted-foreground text-sm">
																<Badge
																	variant="secondary"
																	className={getRelationshipColor(
																		relationship.relationshipType,
																	)}
																>
																	{relationship.relationshipType.replace(
																		/_/g,
																		" ",
																	)}
																</Badge>
																{relationship.startDate && (
																	<span>
																		Since {formatDate(relationship.startDate)}
																	</span>
																)}
																{!relationship.isActive && (
																	<Badge
																		variant="outline"
																		className="text-red-600"
																	>
																		Inactive
																	</Badge>
																)}
															</div>
															{relationship.description && (
																<p className="mt-1 text-muted-foreground text-sm">
																	{relationship.description}
																</p>
															)}
														</div>
													</div>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<ChevronDown className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															{onEditRelationship && (
																<DropdownMenuItem
																	onClick={() =>
																		onEditRelationship(
																			relationship.id,
																			relationship,
																		)
																	}
																>
																	<Edit className="mr-2 h-4 w-4" />
																	Edit
																</DropdownMenuItem>
															)}
															{relationship.relatedClientId && (
																<DropdownMenuItem>
																	<ExternalLink className="mr-2 h-4 w-4" />
																	View Client
																</DropdownMenuItem>
															)}
															<DropdownMenuSeparator />
															{onDeleteRelationship && (
																<DropdownMenuItem
																	onClick={() =>
																		onDeleteRelationship(relationship.id)
																	}
																	className="text-red-600"
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	Delete
																</DropdownMenuItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</CollapsibleContent>
					</Collapsible>
				</Card>

				{/* Contacts Section */}
				<Card>
					<CardHeader
						className="cursor-pointer"
						onClick={() => toggleSection("contacts")}
					>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									{expandedSections.has("contacts") ? (
										<ChevronDown className="h-5 w-5" />
									) : (
										<ChevronRight className="h-5 w-5" />
									)}
									Contact Persons
									<Badge variant="secondary">{filteredContacts.length}</Badge>
								</CardTitle>
								<CardDescription>
									Individual contacts and their roles within the organization
								</CardDescription>
							</div>
							<Dialog
								open={showAddContactDialog}
								onOpenChange={setShowAddContactDialog}
							>
								<DialogTrigger asChild>
									<Button size="sm" onClick={(e) => e.stopPropagation()}>
										<Plus className="mr-2 h-4 w-4" />
										Add Contact
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add New Contact</DialogTitle>
										<DialogDescription>
											Add a new contact person for this client.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="contactName">Name</Label>
												<Input
													id="contactName"
													placeholder="Contact person name"
													value={newContact.name || ""}
													onChange={(e) =>
														setNewContact({
															...newContact,
															name: e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="contactEmail">Email</Label>
												<Input
													id="contactEmail"
													type="email"
													placeholder="contact@example.com"
													value={newContact.email || ""}
													onChange={(e) =>
														setNewContact({
															...newContact,
															email: e.target.value,
														})
													}
												/>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="contactPhone">Phone</Label>
												<Input
													id="contactPhone"
													placeholder="Phone number"
													value={newContact.phone || ""}
													onChange={(e) =>
														setNewContact({
															...newContact,
															phone: e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="contactRole">Role</Label>
												<Select
													value={newContact.role}
													onValueChange={(value) =>
														setNewContact({
															...newContact,
															role: value as ContactRole,
														})
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{Object.keys(CONTACT_ROLE_COLORS).map((role) => (
															<SelectItem key={role} value={role}>
																{role
																	.replace(/_/g, " ")
																	.replace(/\b\w/g, (c) => c.toUpperCase())}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="contactTitle">Title</Label>
												<Input
													id="contactTitle"
													placeholder="Job title"
													value={newContact.title || ""}
													onChange={(e) =>
														setNewContact({
															...newContact,
															title: e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="contactDepartment">Department</Label>
												<Input
													id="contactDepartment"
													placeholder="Department"
													value={newContact.department || ""}
													onChange={(e) =>
														setNewContact({
															...newContact,
															department: e.target.value,
														})
													}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="contactNotes">Notes</Label>
											<Textarea
												id="contactNotes"
												placeholder="Additional notes about this contact"
												value={newContact.notes || ""}
												onChange={(e) =>
													setNewContact({
														...newContact,
														notes: e.target.value,
													})
												}
											/>
										</div>
										<div className="flex justify-end space-x-2">
											<Button
												variant="outline"
												onClick={() => setShowAddContactDialog(false)}
											>
												Cancel
											</Button>
											<Button onClick={handleAddContact}>Add Contact</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<Collapsible open={expandedSections.has("contacts")}>
						<CollapsibleContent>
							<CardContent className="pt-0">
								{filteredContacts.length === 0 ? (
									<div className="py-8 text-center">
										<Users className="mx-auto h-12 w-12 text-muted-foreground" />
										<h3 className="mt-4 font-medium text-lg">
											No contacts found
										</h3>
										<p className="text-muted-foreground">
											{searchQuery
												? "No contacts match your search criteria."
												: "No contact persons have been added yet."}
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{filteredContacts.map((contact) => (
											<div
												key={contact.id}
												className="flex items-center justify-between rounded-lg border p-4"
											>
												<div className="flex items-center space-x-4">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
														<Users className="h-5 w-5 text-gray-600" />
													</div>
													<div>
														<h4 className="flex items-center gap-2 font-medium">
															{contact.name}
															{contact.isPrimary && (
																<Badge variant="default" className="text-xs">
																	Primary
																</Badge>
															)}
														</h4>
														<div className="flex items-center space-x-2 text-muted-foreground text-sm">
															<span>{contact.email}</span>
															{contact.phone && <span>• {contact.phone}</span>}
														</div>
														<div className="mt-1 flex items-center space-x-2">
															<Badge
																variant="secondary"
																className={getContactRoleColor(contact.role)}
															>
																{contact.role.replace(/_/g, " ")}
															</Badge>
															{contact.title && (
																<span className="text-muted-foreground text-sm">
																	{contact.title}
																</span>
															)}
															{contact.department && (
																<span className="text-muted-foreground text-sm">
																	• {contact.department}
																</span>
															)}
															{!contact.isActive && (
																<Badge
																	variant="outline"
																	className="text-red-600"
																>
																	Inactive
																</Badge>
															)}
														</div>
													</div>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<ChevronDown className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														{onEditContact && (
															<DropdownMenuItem
																onClick={() =>
																	onEditContact(contact.id, contact)
																}
															>
																<Edit className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
														)}
														<DropdownMenuItem>
															<ExternalLink className="mr-2 h-4 w-4" />
															Send Message
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														{onDeleteContact && (
															<DropdownMenuItem
																onClick={() => onDeleteContact(contact.id)}
																className="text-red-600"
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</CollapsibleContent>
					</Collapsible>
				</Card>
			</div>
		</TooltipProvider>
	);
}
