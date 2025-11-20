"use client";

import type {
	ClientAnalytics,
	ClientCommunication,
	ClientComplianceHistory,
	ClientContact,
	ClientDocument,
	ClientHistoryEvent,
	ClientNote,
	ClientProfile,
	ClientRelationship,
	ExportFormat,
} from "@gcmc-kaj/types";
import {
	Activity,
	BarChart3,
	Building,
	Download,
	Edit,
	FileText,
	History,
	MessageSquare,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ClientCommunications } from "./ClientCommunications";
import { ClientComplianceTracking } from "./ClientComplianceTracking";
import { ClientDocumentManagement } from "./ClientDocumentManagement";
import { ClientHistoryTimeline } from "./ClientHistoryTimeline";
import { ClientPerformanceAnalytics } from "./ClientPerformanceAnalytics";
import { ClientProfileHeader } from "./ClientProfileHeader";
import { ClientRelationships } from "./ClientRelationships";

interface EnhancedClientProfileProps {
	clientId: number;
	client: ClientProfile;
	analytics?: ClientAnalytics;
	className?: string;
}

type TabValue =
	| "overview"
	| "analytics"
	| "documents"
	| "relationships"
	| "communications"
	| "compliance"
	| "history"
	| "settings";

const TAB_CONFIG = {
	overview: {
		label: "Overview",
		icon: Building,
		description: "Client summary and key metrics",
	},
	analytics: {
		label: "Analytics",
		icon: BarChart3,
		description: "Performance insights and trends",
	},
	documents: {
		label: "Documents",
		icon: FileText,
		description: "Document management and organization",
	},
	relationships: {
		label: "Relationships",
		icon: Users,
		description: "Contacts and business relationships",
	},
	communications: {
		label: "Communications",
		icon: MessageSquare,
		description: "Messages, calls, and notes",
	},
	compliance: {
		label: "Compliance",
		icon: Shield,
		description: "Regulatory compliance tracking",
	},
	history: {
		label: "History",
		icon: History,
		description: "Complete activity timeline",
	},
	settings: {
		label: "Settings",
		icon: Settings,
		description: "Client configuration and preferences",
	},
} as const;

export function EnhancedClientProfile({
	clientId,
	client,
	analytics,
	className,
}: EnhancedClientProfileProps) {
	const [activeTab, setActiveTab] = useState<TabValue>("overview");
	const [isLoading, setIsLoading] = useState(false);

	// Handlers for various operations
	const handleExportReport = async (format: ExportFormat) => {
		setIsLoading(true);
		try {
			// Implement export logic here
			console.log(
				`Exporting ${activeTab} report in ${format} format for client ${clientId}`,
			);
		} catch (error) {
			console.error("Export failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditClient = () => {
		// Implement edit logic here
		console.log(`Editing client ${clientId}`);
	};

	const handleStatusChange = (status: typeof client.status) => {
		// Implement status change logic here
		console.log(`Changing client ${clientId} status to ${status}`);
	};

	// Document handlers
	const handleDocumentUpload = (files: File[]) => {
		console.log(`Uploading ${files.length} documents for client ${clientId}`);
	};

	const handleDocumentDownload = (document: ClientDocument) => {
		console.log(`Downloading document ${document.id}`);
	};

	const handleDocumentView = (document: ClientDocument) => {
		console.log(`Viewing document ${document.id}`);
	};

	const handleDocumentDelete = (documentId: string) => {
		console.log(`Deleting document ${documentId}`);
	};

	// Relationship handlers
	const handleAddRelationship = (relationship: Partial<ClientRelationship>) => {
		console.log("Adding relationship:", relationship);
	};

	const handleEditRelationship = (
		id: string,
		relationship: Partial<ClientRelationship>,
	) => {
		console.log(`Editing relationship ${id}:`, relationship);
	};

	const handleDeleteRelationship = (id: string) => {
		console.log(`Deleting relationship ${id}`);
	};

	// Contact handlers
	const handleAddContact = (contact: Partial<ClientContact>) => {
		console.log("Adding contact:", contact);
	};

	const handleEditContact = (id: string, contact: Partial<ClientContact>) => {
		console.log(`Editing contact ${id}:`, contact);
	};

	const handleDeleteContact = (id: string) => {
		console.log(`Deleting contact ${id}`);
	};

	// Communication handlers
	const handleAddCommunication = (
		communication: Partial<ClientCommunication>,
	) => {
		console.log("Adding communication:", communication);
	};

	const handleEditCommunication = (
		id: string,
		communication: Partial<ClientCommunication>,
	) => {
		console.log(`Editing communication ${id}:`, communication);
	};

	const handleDeleteCommunication = (id: string) => {
		console.log(`Deleting communication ${id}`);
	};

	// Note handlers
	const handleAddNote = (note: Partial<ClientNote>) => {
		console.log("Adding note:", note);
	};

	const handleEditNote = (id: string, note: Partial<ClientNote>) => {
		console.log(`Editing note ${id}:`, note);
	};

	const handleDeleteNote = (id: string) => {
		console.log(`Deleting note ${id}`);
	};

	const handlePinNote = (id: string, pinned: boolean) => {
		console.log(`${pinned ? "Pinning" : "Unpinning"} note ${id}`);
	};

	// History handlers
	const handleAddHistoryEvent = () => {
		console.log("Adding history event");
	};

	// Compliance handlers
	const handleRefreshCompliance = () => {
		console.log("Refreshing compliance data");
	};

	const getTabBadgeCount = (tab: TabValue): number => {
		switch (tab) {
			case "documents":
				return client.documents?.length || 0;
			case "relationships":
				return (
					(client.relationships?.length || 0) + (client.contacts?.length || 0)
				);
			case "communications":
				return (
					(client.communications?.length || 0) +
					(client.clientNotes?.length || 0)
				);
			case "history":
				return client.history?.length || 0;
			default:
				return 0;
		}
	};

	return (
		<TooltipProvider>
			<div className={cn("space-y-6", className)}>
				{/* Client Profile Header */}
				<ClientProfileHeader
					client={client}
					analytics={analytics}
					onEdit={handleEditClient}
					onStatusChange={handleStatusChange}
				/>

				{/* Action Bar */}
				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Button variant="outline" size="sm">
									<Edit className="mr-2 h-4 w-4" />
									Edit Profile
								</Button>
								<Separator orientation="vertical" className="h-4" />
								<Button variant="outline" size="sm">
									<Activity className="mr-2 h-4 w-4" />
									Quick Actions
								</Button>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<Download className="mr-2 h-4 w-4" />
										Export
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => handleExportReport("pdf")}>
										Export as PDF
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleExportReport("excel")}>
										Export as Excel
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleExportReport("csv")}>
										Export as CSV
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => handleExportReport("json")}>
										Export Raw Data
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardContent>
				</Card>

				{/* Main Tabs Interface */}
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as TabValue)}
				>
					<TabsList className="grid h-12 w-full grid-cols-8">
						{(Object.keys(TAB_CONFIG) as TabValue[]).map((tab) => {
							const config = TAB_CONFIG[tab];
							const Icon = config.icon;
							const badgeCount = getTabBadgeCount(tab);

							return (
								<TabsTrigger
									key={tab}
									value={tab}
									className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												<span className="hidden md:inline">{config.label}</span>
												{badgeCount > 0 && (
													<Badge
														variant="secondary"
														className="h-5 px-1.5 text-xs"
													>
														{badgeCount}
													</Badge>
												)}
											</div>
										</TooltipTrigger>
										<TooltipContent>
											<div>
												<p className="font-medium">{config.label}</p>
												<p className="text-muted-foreground text-sm">
													{config.description}
												</p>
											</div>
										</TooltipContent>
									</Tooltip>
								</TabsTrigger>
							);
						})}
					</TabsList>

					{/* Tab Content */}
					<div className="mt-6">
						<TabsContent value="overview" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Client Overview</CardTitle>
									<CardDescription>
										Summary of client information and recent activity
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
										{/* Quick Stats */}
										<div className="space-y-2">
											<h4 className="font-medium">Quick Stats</h4>
											<div className="space-y-1 text-sm">
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Documents:
													</span>
													<span>{client.documents?.length || 0}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Contacts:
													</span>
													<span>{client.contacts?.length || 0}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Tasks:</span>
													<span>{client.tasks?.length || 0}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Notes:</span>
													<span>{client.clientNotes?.length || 0}</span>
												</div>
											</div>
										</div>

										{/* Recent Activity Preview */}
										<div className="space-y-2">
											<h4 className="font-medium">Recent Activity</h4>
											<div className="space-y-2">
												{client.history?.slice(0, 3).map((event) => (
													<div key={event.id} className="text-sm">
														<div className="font-medium">{event.title}</div>
														<div className="text-muted-foreground text-xs">
															{new Date(event.occurredAt).toLocaleDateString()}
														</div>
													</div>
												)) || (
													<p className="text-muted-foreground text-sm">
														No recent activity
													</p>
												)}
											</div>
										</div>

										{/* Quick Actions */}
										<div className="space-y-2">
											<h4 className="font-medium">Quick Actions</h4>
											<div className="space-y-2">
												<Button
													variant="outline"
													size="sm"
													className="w-full justify-start"
												>
													<MessageSquare className="mr-2 h-4 w-4" />
													Send Message
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="w-full justify-start"
												>
													<FileText className="mr-2 h-4 w-4" />
													Upload Document
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="w-full justify-start"
												>
													<Users className="mr-2 h-4 w-4" />
													Add Contact
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="analytics">
							{analytics && (
								<ClientPerformanceAnalytics
									clientId={clientId}
									analytics={analytics}
									onExportReport={handleExportReport}
								/>
							)}
						</TabsContent>

						<TabsContent value="documents">
							<ClientDocumentManagement
								clientId={clientId}
								documents={client.documents || []}
								onUpload={handleDocumentUpload}
								onDownload={handleDocumentDownload}
								onView={handleDocumentView}
								onDelete={handleDocumentDelete}
							/>
						</TabsContent>

						<TabsContent value="relationships">
							<ClientRelationships
								clientId={clientId}
								relationships={client.relationships || []}
								contacts={client.contacts || []}
								onAddRelationship={handleAddRelationship}
								onEditRelationship={handleEditRelationship}
								onDeleteRelationship={handleDeleteRelationship}
								onAddContact={handleAddContact}
								onEditContact={handleEditContact}
								onDeleteContact={handleDeleteContact}
							/>
						</TabsContent>

						<TabsContent value="communications">
							<ClientCommunications
								clientId={clientId}
								communications={client.communications || []}
								notes={client.clientNotes || []}
								contacts={client.contacts || []}
								onAddCommunication={handleAddCommunication}
								onEditCommunication={handleEditCommunication}
								onDeleteCommunication={handleDeleteCommunication}
								onAddNote={handleAddNote}
								onEditNote={handleEditNote}
								onDeleteNote={handleDeleteNote}
								onPinNote={handlePinNote}
							/>
						</TabsContent>

						<TabsContent value="compliance">
							<ClientComplianceTracking
								clientId={clientId}
								complianceHistory={client.complianceHistory || []}
								currentCompliance={client.complianceHistory?.[0]}
								onRefreshCompliance={handleRefreshCompliance}
							/>
						</TabsContent>

						<TabsContent value="history">
							<ClientHistoryTimeline
								clientId={clientId}
								events={client.history || []}
								onAddEvent={handleAddHistoryEvent}
							/>
						</TabsContent>

						<TabsContent value="settings">
							<Card>
								<CardHeader>
									<CardTitle>Client Settings</CardTitle>
									<CardDescription>
										Configure client preferences and system settings
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-6">
										<div>
											<h4 className="mb-2 font-medium">Notifications</h4>
											<div className="space-y-2">
												<label className="flex items-center space-x-2">
													<input type="checkbox" defaultChecked />
													<span className="text-sm">Email notifications</span>
												</label>
												<label className="flex items-center space-x-2">
													<input type="checkbox" defaultChecked />
													<span className="text-sm">SMS alerts</span>
												</label>
												<label className="flex items-center space-x-2">
													<input type="checkbox" />
													<span className="text-sm">Push notifications</span>
												</label>
											</div>
										</div>

										<Separator />

										<div>
											<h4 className="mb-2 font-medium">Privacy</h4>
											<div className="space-y-2">
												<label className="flex items-center space-x-2">
													<input type="checkbox" />
													<span className="text-sm">
														Hide sensitive information
													</span>
												</label>
												<label className="flex items-center space-x-2">
													<input type="checkbox" defaultChecked />
													<span className="text-sm">Audit all actions</span>
												</label>
											</div>
										</div>

										<Separator />

										<div>
											<h4 className="mb-2 font-medium">Data Management</h4>
											<div className="space-y-2">
												<Button variant="outline" size="sm">
													Export All Data
												</Button>
												<Button variant="outline" size="sm">
													Archive Client
												</Button>
												<Button variant="destructive" size="sm">
													Delete Client
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</TooltipProvider>
	);
}
