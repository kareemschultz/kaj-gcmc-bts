import { ComponentsDemo } from "@/components/components-demo";

export default function ComponentsPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="mb-2 font-bold text-4xl">Enterprise UI Components</h1>
				<p className="text-lg text-muted-foreground">
					Comprehensive showcase of enterprise-grade UI components built with
					shadcn/ui and Next.js 16
				</p>
			</div>

			<ComponentsDemo />
		</div>
	);
}
