import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, Shield, Building2, FileText, TrendingUp } from "lucide-react";

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
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
			{/* Left Side - Branding & Features */}
			<div className="hidden lg:flex flex-1 relative overflow-hidden">
				{/* Background Pattern */}
				<div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20" />
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz4KPC9zdmc+')] opacity-30" />

				<div className="relative z-10 flex flex-col justify-center px-12 py-20">
					{/* Logo & Company Name */}
					<div className="mb-12">
						<div className="flex items-center space-x-4 mb-6">
							<div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
								<Building2 className="w-7 h-7 text-white" />
							</div>
							<div>
								<h1 className="text-3xl font-bold text-white">GCMC-KAJ</h1>
								<p className="text-emerald-400 font-medium">Business Tax Services</p>
							</div>
						</div>
						<p className="text-slate-300 text-lg leading-relaxed">
							Your trusted partner for comprehensive tax compliance and business services in Guyana.
							Streamline your operations with our professional platform.
						</p>
					</div>

					{/* Features */}
					<div className="space-y-6">
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center mt-1">
								<Shield className="w-5 h-5 text-emerald-400" />
							</div>
							<div>
								<h3 className="text-white font-semibold mb-2">Secure & Compliant</h3>
								<p className="text-slate-400">Enterprise-grade security with full regulatory compliance for Guyana's tax requirements.</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mt-1">
								<FileText className="w-5 h-5 text-blue-400" />
							</div>
							<div>
								<h3 className="text-white font-semibold mb-2">Complete Tax Management</h3>
								<p className="text-slate-400">Handle GRT, Corporation Tax, PAYE, and all tax filing requirements in one platform.</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mt-1">
								<TrendingUp className="w-5 h-5 text-purple-400" />
							</div>
							<div>
								<h3 className="text-white font-semibold mb-2">Real-time Analytics</h3>
								<p className="text-slate-400">Get insights into compliance status, deadlines, and business performance metrics.</p>
							</div>
						</div>
					</div>

					{/* Stats */}
					<div className="mt-16 grid grid-cols-3 gap-8">
						<div className="text-center">
							<div className="text-3xl font-bold text-emerald-400 mb-2">99.9%</div>
							<div className="text-slate-400 text-sm">Uptime</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
							<div className="text-slate-400 text-sm">Clients</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
							<div className="text-slate-400 text-sm">Support</div>
						</div>
					</div>
				</div>
			</div>

			{/* Right Side - Login Form */}
			<div className="flex-1 flex items-center justify-center px-8 py-20">
				<div className="w-full max-w-md">
					{/* Mobile Logo */}
					<div className="lg:hidden flex items-center justify-center space-x-3 mb-12">
						<div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
							<Building2 className="w-6 h-6 text-white" />
						</div>
						<div>
							<h1 className="text-xl font-bold text-white">GCMC-KAJ</h1>
							<p className="text-emerald-400 text-sm">Business Tax Services</p>
						</div>
					</div>

					{/* Form Header */}
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
						<p className="text-slate-400">Sign in to access your tax management dashboard</p>
					</div>

					{/* Demo Credentials Notice */}
					<div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4 mb-6">
						<div className="flex items-center space-x-2 mb-2">
							<Shield className="w-4 h-4 text-emerald-400" />
							<span className="text-emerald-400 text-sm font-medium">Demo Credentials</span>
						</div>
						<div className="text-slate-300 text-sm space-y-1">
							<div><strong>Email:</strong> admin@gcmc-kaj.com</div>
							<div><strong>Password:</strong> Admin123!@#</div>
						</div>
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
									<Label htmlFor={field.name} className="text-slate-200 font-medium">
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
										className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
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
									<Label htmlFor={field.name} className="text-slate-200 font-medium">
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
											className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 pr-12"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
										>
											{showPassword ? (
												<EyeOff className="w-5 h-5" />
											) : (
												<Eye className="w-5 h-5" />
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
									className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 transition-all duration-200"
								>
									{state.isSubmitting || isLoading ? (
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
							className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
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