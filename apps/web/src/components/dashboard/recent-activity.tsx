"use client";

import { motion } from "framer-motion";
import { Edit, Eye, FileText, Upload, Users } from "lucide-react";
import Link from "next/link";
import { DashboardActivityFeed } from "@/components/ui/activity-feed";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const RECENT_ACTIVITY_SKELETON_KEYS = Array.from(
	{ length: 5 },
	(_, index) => `recent-activity-skeleton-${index}`,
);

export function RecentActivity() {
	const { data, isLoading } = trpc.dashboard.overview.useQuery();

	if (isLoading) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				<DashboardActivityFeed activities={[]} />
			</motion.div>
		);
	}

	if (!data) {
		return null;
	}

	// Transform data into ActivityItem format
	const activities = [
		...data.recentActivity.clients.map(
			(
				client: (typeof data.recentActivity.clients)[number],
				index: number,
			) => ({
				id: `client-${client.id}-${index}`,
				type: "user" as const,
				action: "Client Registration",
				description: `New ${client.type} client "${client.name}" was registered in the system`,
				user: {
					name: "System",
					email: "system@gcmc-kaj.com",
				},
				timestamp: client.createdAt,
				severity: "info" as const,
				relatedEntity: {
					type: "client" as const,
					id: client.id,
					name: client.name,
				},
			}),
		),
		...data.recentActivity.documents.map(
			(doc: (typeof data.recentActivity.documents)[number], index: number) => ({
				id: `document-${doc.id}-${index}`,
				type: "document" as const,
				action: "Document Upload",
				description: `${doc.documentType.name} uploaded for ${doc.client.name}`,
				user: {
					name: doc.client.name,
					email: `${doc.client.name.toLowerCase().replace(/\s+/g, ".")}@client.gcmc-kaj.com`,
				},
				timestamp: doc.createdAt,
				severity: "success" as const,
				relatedEntity: {
					type: "document" as const,
					id: doc.id,
					name: doc.title,
				},
			}),
		),
		// Add some mock compliance activities for demonstration
		{
			id: "compliance-1",
			type: "compliance" as const,
			action: "Compliance Score Update",
			description:
				"Quarterly compliance assessment completed with improved scoring",
			user: {
				name: "GCMC-KAJ System",
				email: "compliance@gcmc-kaj.com",
			},
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
			severity: "success" as const,
			metadata: {
				previousScore: 85,
				newScore: 92,
				improvement: 7,
			},
		},
		{
			id: "system-1",
			type: "system" as const,
			action: "System Backup",
			description: "Automated daily backup completed successfully",
			timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
			severity: "info" as const,
		},
	]
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		)
		.slice(0, 8); // Limit to 8 most recent activities

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2, duration: 0.3 }}
		>
			<DashboardActivityFeed activities={activities} />
		</motion.div>
	);
}
