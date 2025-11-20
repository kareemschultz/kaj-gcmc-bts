import { useForm } from "@tanstack/react-form";
import {
	Building2,
	Eye,
	EyeOff,
	FileText,
	Shield,
	TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			try {
				setIsLoading(true);
				await authClient.signIn.email(
					{
						email: value.email,
						password: value.password,
					},
					{
						onSuccess: (_data) => {
							toast.success("Welcome back! Redirecting to dashboard...");
							router.push("/dashboard");
						},
						onError: (error) => {
							console.error("Sign in error:", error);
							const errorMessage =
								error?.error?.message ||
								error?.error?.statusText ||
								"Invalid email or password. Please try again.";
							toast.error(errorMessage);
						},
					},
				);
			} catch (error) {
				console.error("Form submission error:", error);
				toast.error("An unexpected error occurred. Please try again.");
			} finally {
				setIsLoading(false);
			}
		},
		validators: {
			onSubmit: z.object({
				email: z.string().email("Please enter a valid email address"),
				password: z.string().min(1, "Password is required"),
			}),
		},
	});

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
			{/* Left Side - Branding & Features */}
			<div className="relative hidden flex-1 overflow-hidden lg:flex">
				{/* Background Pattern */}
				<div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20" />
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz4KPC9zdmc+')] opacity-30" />

				<div className="relative z-10 flex flex-col justify-center px-12 py-20">
					{/* Logo & Company Name */}
					<div className="mb-12">
						<div className="mb-6 flex items-center space-x-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
								<Building2 className="h-7 w-7 text-white" />
							</div>
							<div>
								<h1 className="font-bold text-3xl text-white">GCMC-KAJ</h1>
								<p className="font-medium text-emerald-400">
									Business Tax Services
								</p>
							</div>
						</div>
						<p className="text-lg text-slate-300 leading-relaxed">
							Your trusted partner for comprehensive tax compliance and business
							services in Guyana. Streamline your operations with our
							professional platform.
						</p>
					</div>

					{/* Features */}
					<div className="space-y-6">
						<div className="flex items-start space-x-4">
							<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
								<Shield className="h-5 w-5 text-emerald-400" />
							</div>
							<div>
								<h3 className="mb-2 font-semibold text-white">
									Secure & Compliant
								</h3>
								<p className="text-slate-400">
									Enterprise-grade security with full regulatory compliance for
									Guyana's tax requirements.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
								<FileText className="h-5 w-5 text-blue-400" />
							</div>
							<div>
								<h3 className="mb-2 font-semibold text-white">
									Complete Tax Management
								</h3>
								<p className="text-slate-400">
									Handle GRT, Corporation Tax, PAYE, and all tax filing
									requirements in one platform.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
								<TrendingUp className="h-5 w-5 text-purple-400" />
							</div>
							<div>
								<h3 className="mb-2 font-semibold text-white">
									Real-time Analytics
								</h3>
								<p className="text-slate-400">
									Get insights into compliance status, deadlines, and business
									performance metrics.
								</p>
							</div>
						</div>
					</div>

					{/* Stats */}
					<div className="mt-16 grid grid-cols-3 gap-8">
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl text-emerald-400">
								99.9%
							</div>
							<div className="text-slate-400 text-sm">Uptime</div>
						</div>
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl text-blue-400">500+</div>
							<div className="text-slate-400 text-sm">Clients</div>
						</div>
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl text-purple-400">
								24/7
							</div>
							<div className="text-slate-400 text-sm">Support</div>
						</div>
					</div>
				</div>
			</div>

			{/* Right Side - Login Form */}
			<div className="flex flex-1 items-center justify-center px-8 py-20">
				<div className="w-full max-w-md">
					{/* Mobile Logo */}
					<div className="mb-12 flex items-center justify-center space-x-3 lg:hidden">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
							<Building2 className="h-6 w-6 text-white" />
						</div>
						<div>
							<h1 className="font-bold text-white text-xl">GCMC-KAJ</h1>
							<p className="text-emerald-400 text-sm">Business Tax Services</p>
						</div>
					</div>

					{/* Form Header */}
					<div className="mb-8 text-center">
						<h2 className="mb-2 font-bold text-3xl text-white">Welcome Back</h2>
						<p className="text-slate-400">
							Sign in to access your tax management dashboard
						</p>
					</div>

					{/* Login Form */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-6"
					>
						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label
										htmlFor={field.name}
										className="font-medium text-slate-200"
									>
										Email Address
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										placeholder="Enter your email address"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
									/>
									{field.state.meta.errors?.length > 0 && (
										<p className="text-red-400 text-sm">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label
										htmlFor={field.name}
										className="font-medium text-slate-200"
									>
										Password
									</Label>
									<div className="relative">
										<Input
											id={field.name}
											name={field.name}
											type={showPassword ? "text" : "password"}
											placeholder="Enter your password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="border-slate-700 bg-slate-800/50 pr-12 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="-translate-y-1/2 absolute top-1/2 right-3 text-slate-400 hover:text-slate-200"
										>
											{showPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>
									{field.state.meta.errors?.length > 0 && (
										<p className="text-red-400 text-sm">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									disabled={!state.canSubmit || state.isSubmitting || isLoading}
									className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 py-3 font-semibold text-white transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800"
								>
									{state.isSubmitting || isLoading ? (
										<div className="flex items-center space-x-2">
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
											<span>Signing In...</span>
										</div>
									) : (
										"Sign In to Dashboard"
									)}
								</Button>
							)}
						</form.Subscribe>
					</form>

					{/* Additional Options */}
					<div className="mt-8 text-center">
						<button
							type="button"
							onClick={onSwitchToSignUp}
							className="font-medium text-emerald-400 text-sm transition-colors hover:text-emerald-300"
						>
							Need an account? Contact your administrator
						</button>
					</div>

					{/* Footer */}
					<div className="mt-12 text-center">
						<p className="text-slate-500 text-xs">
							© 2024 GCMC-KAJ Business Tax Services. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
