"use client";

import { Building2, Shield, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { RolesList } from "@/components/admin/roles-list";
import { TenantSettings } from "@/components/admin/tenant-settings";
import { UsersList } from "@/components/admin/users-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentTab = searchParams.get("tab") || "users";

	const handleTabChange = (value: string) => {
		router.push(`/admin?tab=${value}`);
	};

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Admin</h1>
				<p className="text-muted-foreground">
					Manage users, roles, and tenant settings
				</p>
			</div>

			<Tabs value={currentTab} onValueChange={handleTabChange}>
				<TabsList className="mb-6">
					<TabsTrigger value="users">
						<Users className="mr-2 h-4 w-4" />
						Users
					</TabsTrigger>
					<TabsTrigger value="roles">
						<Shield className="mr-2 h-4 w-4" />
						Roles
					</TabsTrigger>
					<TabsTrigger value="tenant">
						<Building2 className="mr-2 h-4 w-4" />
						Tenant
					</TabsTrigger>
				</TabsList>

				<TabsContent value="users">
					<UsersList />
				</TabsContent>

				<TabsContent value="roles">
					<RolesList />
				</TabsContent>

				<TabsContent value="tenant">
					<TenantSettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}
