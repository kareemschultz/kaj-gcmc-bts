import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TasksList } from "@/components/tasks/tasks-list";
import { authClient } from "@/lib/auth-client";

export default async function TasksPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-3xl">Tasks</h1>
			</div>
			<TasksList />
		</div>
	);
}
