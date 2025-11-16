"use client";

import { CheckCircle2, Loader2, Lock, Mail, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [touched, setTouched] = useState({ email: false, password: false });

	// Email validation
	const validateEmail = (value: string) => {
		if (!value) {
			setEmailError("Email is required");
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(value)) {
			setEmailError("Please enter a valid email address");
			return false;
		}
		setEmailError("");
		return true;
	};

	// Password validation
	const validatePassword = (value: string) => {
		if (!value) {
			setPasswordError("Password is required");
			return false;
		}
		if (value.length < 6) {
			setPasswordError("Password must be at least 6 characters");
			return false;
		}
		setPasswordError("");
		return true;
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);
		if (touched.email) {
			validateEmail(value);
		}
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setPassword(value);
		if (touched.password) {
			validatePassword(value);
		}
	};

	const handleEmailBlur = () => {
		setTouched((prev) => ({ ...prev, email: true }));
		validateEmail(email);
	};

	const handlePasswordBlur = () => {
		setTouched((prev) => ({ ...prev, password: true }));
		validatePassword(password);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate all fields
		const isEmailValid = validateEmail(email);
		const isPasswordValid = validatePassword(password);
		setTouched({ email: true, password: true });

		if (!isEmailValid || !isPasswordValid) {
			return;
		}

		setIsLoading(true);

		try {
			await authClient.signIn.email({
				email,
				password,
				fetchOptions: {
					onSuccess: () => {
						toast.success("Logged in successfully", {
							description: "Redirecting to dashboard...",
						});
						setTimeout(() => {
							router.push("/dashboard");
						}, 300);
					},
					onError: (ctx) => {
						toast.error(ctx.error.message || "Failed to sign in", {
							description: "Please check your credentials and try again",
						});
					},
				},
			});
		} catch (_error) {
			toast.error("An error occurred during sign in", {
				description: "Please try again later",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const isEmailValid = email && !emailError && touched.email;
	const isPasswordValid = password && !passwordError && touched.password;
	const hasEmailError = emailError && touched.email;
	const hasPasswordError = passwordError && touched.password;

	return (
		<form onSubmit={handleSubmit} className="mt-8 space-y-6">
			<div className="space-y-2">
				<Label htmlFor="email" className="font-medium text-foreground text-sm">
					Email address
				</Label>
				<div className="group relative">
					<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground transition-colors group-focus-within:text-blue-600">
						<Mail className="h-4 w-4" />
					</div>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						value={email}
						onChange={handleEmailChange}
						onBlur={handleEmailBlur}
						placeholder="you@example.com"
						className={`h-11 pr-10 pl-10 transition-all duration-200 ${
							hasEmailError
								? "border-red-500 focus-visible:ring-red-500"
								: isEmailValid
									? "border-green-500 focus-visible:ring-green-500"
									: "focus-visible:ring-blue-600"
						}`}
						aria-invalid={!!hasEmailError}
						aria-describedby={hasEmailError ? "email-error" : undefined}
					/>
					{touched.email && (
						<div className="-translate-y-1/2 absolute top-1/2 right-3 transition-all duration-200">
							{isEmailValid ? (
								<CheckCircle2 className="fade-in zoom-in h-5 w-5 animate-in text-green-600 duration-200" />
							) : hasEmailError ? (
								<XCircle className="fade-in zoom-in h-5 w-5 animate-in text-red-500 duration-200" />
							) : null}
						</div>
					)}
				</div>
				{hasEmailError && (
					<p
						id="email-error"
						className="slide-in-from-top-1 flex animate-in items-center gap-1 text-red-600 text-sm duration-200"
					>
						<XCircle className="h-3.5 w-3.5" />
						{emailError}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label
						htmlFor="password"
						className="font-medium text-foreground text-sm"
					>
						Password
					</Label>
					<a
						href="/forgot-password"
						className="font-medium text-blue-600 text-sm transition-colors hover:text-blue-700 hover:underline"
					>
						Forgot password?
					</a>
				</div>
				<div className="group relative">
					<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground transition-colors group-focus-within:text-blue-600">
						<Lock className="h-4 w-4" />
					</div>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={handlePasswordChange}
						onBlur={handlePasswordBlur}
						placeholder="••••••••"
						className={`h-11 pr-10 pl-10 transition-all duration-200 ${
							hasPasswordError
								? "border-red-500 focus-visible:ring-red-500"
								: isPasswordValid
									? "border-green-500 focus-visible:ring-green-500"
									: "focus-visible:ring-blue-600"
						}`}
						aria-invalid={!!hasPasswordError}
						aria-describedby={hasPasswordError ? "password-error" : undefined}
					/>
					{touched.password && (
						<div className="-translate-y-1/2 absolute top-1/2 right-3 transition-all duration-200">
							{isPasswordValid ? (
								<CheckCircle2 className="fade-in zoom-in h-5 w-5 animate-in text-green-600 duration-200" />
							) : hasPasswordError ? (
								<XCircle className="fade-in zoom-in h-5 w-5 animate-in text-red-500 duration-200" />
							) : null}
						</div>
					)}
				</div>
				{hasPasswordError && (
					<p
						id="password-error"
						className="slide-in-from-top-1 flex animate-in items-center gap-1 text-red-600 text-sm duration-200"
					>
						<XCircle className="h-3.5 w-3.5" />
						{passwordError}
					</p>
				)}
			</div>

			<Button
				type="submit"
				className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-500 font-medium text-white shadow-blue-500/30 shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isLoading}
			>
				{isLoading ? (
					<span className="flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						Signing in...
					</span>
				) : (
					"Sign in"
				)}
			</Button>

			<div className="text-center">
				<p className="text-muted-foreground text-sm">
					Don't have an account?{" "}
					<a
						href="/sign-up"
						className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
					>
						Sign up
					</a>
				</p>
			</div>
		</form>
	);
}
