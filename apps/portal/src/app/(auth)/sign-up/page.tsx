import { Building2 } from "lucide-react";
import SignUpForm from "@/components/sign-up-form";

export default function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
			<div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-100 transition-all duration-300 hover:shadow-blue-500/20 dark:ring-blue-900/20">
				<div className="text-center">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/30 shadow-lg ring-4 ring-blue-100 transition-transform duration-300 hover:scale-105 dark:ring-blue-900/30">
						<Building2 className="h-7 w-7 text-white" />
					</div>
					<h2 className="mt-6 font-bold text-3xl text-foreground tracking-tight">
						Create an account
					</h2>
					<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
						Get started with your free account today
					</p>
				</div>
				<SignUpForm />
			</div>
		</div>
	);
}
