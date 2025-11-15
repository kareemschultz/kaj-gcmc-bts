import { Building2 } from "lucide-react";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg">
				<div className="text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
						<Building2 className="h-6 w-6 text-primary-foreground" />
					</div>
					<h2 className="mt-6 font-bold text-3xl">Client Portal</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Sign in to access your account
					</p>
				</div>
				<SignInForm />
			</div>
		</div>
	);
}
