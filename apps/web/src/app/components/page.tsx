import { ComponentsDemo } from "@/components/components-demo";

export default function ComponentsPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="font-bold text-4xl mb-2">Enterprise UI Components</h1>
				<p className="text-muted-foreground text-lg">
					Comprehensive showcase of enterprise-grade UI components built with shadcn/ui and Next.js 16
				</p>
			</div>

			<ComponentsDemo />
		</div>
	);
}