// Role definitions and initial role setup

import type { UserRole } from "@GCMC-KAJ/types";

export interface RoleDefinition {
	name: UserRole;
	description: string;
	permissions: {
		module: string;
		actions: string[];
	}[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
	{
		name: "SuperAdmin",
		description: "Full system access across all tenants",
		permissions: [{ module: "*", actions: ["*"] }],
	},
	{
		name: "FirmAdmin",
		description: "Full access within tenant, can manage users and settings",
		permissions: [
			{ module: "clients", actions: ["view", "create", "edit", "delete"] },
			{ module: "documents", actions: ["view", "create", "edit", "delete"] },
			{
				module: "filings",
				actions: ["view", "create", "edit", "delete", "submit"],
			},
			{ module: "services", actions: ["view", "create", "edit", "delete"] },
			{ module: "users", actions: ["view", "create", "edit", "delete"] },
			{ module: "settings", actions: ["view", "edit"] },
			{ module: "compliance", actions: ["view", "edit"] },
			{ module: "analytics", actions: ["view"] },
			{ module: "notifications", actions: ["view", "send"] },
			{
				module: "tasks",
				actions: ["view", "create", "edit", "delete", "assign"],
			},
			{ module: "dashboard", actions: ["view"] },
		],
	},
	{
		name: "ComplianceManager",
		description: "Manage compliance, filings, and client oversight",
		permissions: [
			{ module: "clients", actions: ["view", "create", "edit"] },
			{ module: "documents", actions: ["view", "create", "edit"] },
			{ module: "filings", actions: ["view", "create", "edit", "submit"] },
			{ module: "services", actions: ["view", "create", "edit"] },
			{ module: "compliance", actions: ["view", "edit"] },
		],
	},
	{
		name: "ComplianceOfficer",
		description: "Handle client filings and document review",
		permissions: [
			{ module: "clients", actions: ["view", "edit"] },
			{ module: "documents", actions: ["view", "create", "edit"] },
			{ module: "filings", actions: ["view", "create", "edit", "submit"] },
		],
	},
	{
		name: "DocumentOfficer",
		description: "Manage document uploads and organization",
		permissions: [
			{ module: "clients", actions: ["view"] },
			{ module: "documents", actions: ["view", "create", "edit"] },
		],
	},
	{
		name: "FilingClerk",
		description: "Prepare and submit filings",
		permissions: [
			{ module: "clients", actions: ["view"] },
			{ module: "filings", actions: ["view", "create", "edit"] },
		],
	},
	{
		name: "Viewer",
		description: "Read-only access to client information",
		permissions: [
			{ module: "clients", actions: ["view"] },
			{ module: "documents", actions: ["view"] },
			{ module: "filings", actions: ["view"] },
			{ module: "services", actions: ["view"] },
			{ module: "analytics", actions: ["view"] },
			{ module: "compliance", actions: ["view"] },
			{ module: "tasks", actions: ["view"] },
			{ module: "notifications", actions: ["view"] },
			{ module: "dashboard", actions: ["view"] },
		],
	},
	{
		name: "Admin",
		description: "Full administrative access to all platform features",
		permissions: [
			{ module: "dashboard", actions: ["view", "edit"] },
			{ module: "analytics", actions: ["view", "edit"] },
			{ module: "clients", actions: ["view", "create", "edit", "delete"] },
			{ module: "documents", actions: ["view", "create", "edit", "delete"] },
			{ module: "filings", actions: ["view", "create", "edit", "submit", "delete"] },
			{ module: "services", actions: ["view", "create", "edit", "delete"] },
			{ module: "compliance", actions: ["view", "edit", "manage"] },
			{ module: "tasks", actions: ["view", "create", "edit", "delete"] },
			{ module: "notifications", actions: ["view", "create", "edit", "delete"] },
			{ module: "users", actions: ["view", "create", "edit", "delete"] },
			{ module: "profile", actions: ["view", "edit"] },
			{ module: "system", actions: ["view", "edit", "manage"] },
		],
	},
	{
		name: "ClientPortalUser",
		description: "Client portal access for end users",
		permissions: [
			{ module: "client_portal", actions: ["view", "upload", "message"] },
		],
	},
];
