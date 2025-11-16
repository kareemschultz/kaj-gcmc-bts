"use client";

import {
	CheckCircle2,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	User,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [nameError, setNameError] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [confirmPasswordError, setConfirmPasswordError] = useState("");

	const [touched, setTouched] = useState({
		name: false,
		email: false,
		password: false,
		confirmPassword: false,
	});

	// Name validation
	const validateName = (value: string) => {
		if (!value) {
			setNameError("Name is required");
			return false;
		}
		if (value.length < 2) {
			setNameError("Name must be at least 2 characters");
			return false;
		}
		setNameError("");
		return true;
	};

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

	// Password validation with strength requirements
	const validatePassword = (value: string) => {
		if (!value) {
			setPasswordError("Password is required");
			return false;
		}
		if (value.length < 8) {
			setPasswordError("Password must be at least 8 characters");
			return false;
		}
		if (!/(?=.*[a-z])/.test(value)) {
			setPasswordError("Password must contain at least one lowercase letter");
			return false;
		}
		if (!/(?=.*[A-Z])/.test(value)) {
			setPasswordError("Password must contain at least one uppercase letter");
			return false;
		}
		if (!/(?=.*\d)/.test(value)) {
			setPasswordError("Password must contain at least one number");
			return false;
		}
		setPasswordError("");
		return true;
	};

	// Confirm password validation
	const validateConfirmPassword = (value: string) => {
		if (!value) {
			setConfirmPasswordError("Please confirm your password");
			return false;
		}
		if (value !== password) {
			setConfirmPasswordError("Passwords do not match");
			return false;
		}
		setConfirmPasswordError("");
		return true;
	};

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setName(value);
		if (touched.name) {
			validateName(value);
		}
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
		if (touched.confirmPassword && confirmPassword) {
			validateConfirmPassword(confirmPassword);
		}
	};

	const handleConfirmPasswordChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const value = e.target.value;
		setConfirmPassword(value);
		if (touched.confirmPassword) {
			validateConfirmPassword(value);
		}
	};

	const handleNameBlur = () => {
		setTouched((prev) => ({ ...prev, name: true }));
		validateName(name);
	};

	const handleEmailBlur = () => {
		setTouched((prev) => ({ ...prev, email: true }));
		validateEmail(email);
	};

	const handlePasswordBlur = () => {
		setTouched((prev) => ({ ...prev, password: true }));
		validatePassword(password);
	};

	const handleConfirmPasswordBlur = () => {
		setTouched((prev) => ({ ...prev, confirmPassword: true }));
		validateConfirmPassword(confirmPassword);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate all fields
		const isNameValid = validateName(name);
		const isEmailValid = validateEmail(email);
		const isPasswordValid = validatePassword(password);
		const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
		setTouched({
			name: true,
			email: true,
			password: true,
			confirmPassword: true,
		});

		if (
			!isNameValid ||
			!isEmailValid ||
			!isPasswordValid ||
			!isConfirmPasswordValid
		) {
			return;
		}

		setIsLoading(true);

		try {
			await authClient.signUp.email({
				email,
				password,
				name,
				fetchOptions: {
					onSuccess: () => {
						toast.success("Account created successfully", {
							description: "Redirecting to dashboard...",
						});
						setTimeout(() => {
							router.push("/dashboard");
						}, 300);
					},
					onError: (ctx) => {
						toast.error(ctx.error.message || "Failed to create account", {
							description: "Please try again or contact support",
						});
					},
				},
			});
		} catch (_error) {
			toast.error("An error occurred during sign up", {
				description: "Please try again later",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const isNameValid = name && !nameError && touched.name;
	const isEmailValid = email && !emailError && touched.email;
	const isPasswordValid = password && !passwordError && touched.password;
	const isConfirmPasswordValid =
		confirmPassword && !confirmPasswordError && touched.confirmPassword;

	const hasNameError = nameError && touched.name;
	const hasEmailError = emailError && touched.email;
	const hasPasswordError = passwordError && touched.password;
	const hasConfirmPasswordError =
		confirmPasswordError && touched.confirmPassword;

	// Password strength indicator
	const getPasswordStrength = () => {
		if (!password) return 0;
		let strength = 0;
		if (password.length >= 8) strength += 25;
		if (/(?=.*[a-z])/.test(password)) strength += 25;
		if (/(?=.*[A-Z])/.test(password)) strength += 25;
		if (/(?=.*\d)/.test(password)) strength += 25;
		return strength;
	};

	const passwordStrength = getPasswordStrength();
	const getStrengthColor = () => {
		if (passwordStrength >= 100) return "bg-green-500";
		if (passwordStrength >= 75) return "bg-blue-500";
		if (passwordStrength >= 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	const getStrengthText = () => {
		if (passwordStrength >= 100) return "Strong";
		if (passwordStrength >= 75) return "Good";
		if (passwordStrength >= 50) return "Fair";
		return "Weak";
	};

	return (
		<form onSubmit={handleSubmit} className="mt-8 space-y-5">
			{/* Name Field */}
			<div className="space-y-2">
				<Label htmlFor="name" className="font-medium text-foreground text-sm">
					Full Name
				</Label>
				<div className="group relative">
					<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground transition-colors group-focus-within:text-blue-600">
						<User className="h-4 w-4" />
					</div>
					<Input
						id="name"
						name="name"
						type="text"
						autoComplete="name"
						required
						value={name}
						onChange={handleNameChange}
						onBlur={handleNameBlur}
						placeholder="John Doe"
						className={`h-11 pr-10 pl-10 transition-all duration-200 ${
							hasNameError
								? "border-red-500 focus-visible:ring-red-500"
								: isNameValid
									? "border-green-500 focus-visible:ring-green-500"
									: "focus-visible:ring-blue-600"
						}`}
						aria-invalid={!!hasNameError}
						aria-describedby={hasNameError ? "name-error" : undefined}
					/>
					{touched.name && (
						<div className="-translate-y-1/2 absolute top-1/2 right-3 transition-all duration-200">
							{isNameValid ? (
								<CheckCircle2 className="fade-in zoom-in h-5 w-5 animate-in text-green-600 duration-200" />
							) : hasNameError ? (
								<XCircle className="fade-in zoom-in h-5 w-5 animate-in text-red-500 duration-200" />
							) : null}
						</div>
					)}
				</div>
				{hasNameError && (
					<p
						id="name-error"
						className="slide-in-from-top-1 flex animate-in items-center gap-1 text-red-600 text-sm duration-200"
					>
						<XCircle className="h-3.5 w-3.5" />
						{nameError}
					</p>
				)}
			</div>

			{/* Email Field */}
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

			{/* Password Field */}
			<div className="space-y-2">
				<Label
					htmlFor="password"
					className="font-medium text-foreground text-sm"
				>
					Password
				</Label>
				<div className="group relative">
					<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground transition-colors group-focus-within:text-blue-600">
						<Lock className="h-4 w-4" />
					</div>
					<Input
						id="password"
						name="password"
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						required
						value={password}
						onChange={handlePasswordChange}
						onBlur={handlePasswordBlur}
						placeholder="••••••••"
						className={`h-11 pr-20 pl-10 transition-all duration-200 ${
							hasPasswordError
								? "border-red-500 focus-visible:ring-red-500"
								: isPasswordValid
									? "border-green-500 focus-visible:ring-green-500"
									: "focus-visible:ring-blue-600"
						}`}
						aria-invalid={!!hasPasswordError}
						aria-describedby={hasPasswordError ? "password-error" : undefined}
					/>
					<div className="-translate-y-1/2 absolute top-1/2 right-3 flex items-center gap-2">
						{touched.password &&
							(isPasswordValid ? (
								<CheckCircle2 className="fade-in zoom-in h-5 w-5 animate-in text-green-600 duration-200" />
							) : hasPasswordError ? (
								<XCircle className="fade-in zoom-in h-5 w-5 animate-in text-red-500 duration-200" />
							) : null)}
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="text-muted-foreground transition-colors hover:text-foreground"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>
				{password && touched.password && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Password strength</span>
							<span
								className={`font-medium ${
									passwordStrength >= 100
										? "text-green-600"
										: passwordStrength >= 75
											? "text-blue-600"
											: passwordStrength >= 50
												? "text-yellow-600"
												: "text-red-600"
								}`}
							>
								{getStrengthText()}
							</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
							<div
								className={`h-full ${getStrengthColor()} transition-all duration-300`}
								style={{ width: `${passwordStrength}%` }}
							/>
						</div>
					</div>
				)}
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

			{/* Confirm Password Field */}
			<div className="space-y-2">
				<Label
					htmlFor="confirmPassword"
					className="font-medium text-foreground text-sm"
				>
					Confirm Password
				</Label>
				<div className="group relative">
					<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground transition-colors group-focus-within:text-blue-600">
						<Lock className="h-4 w-4" />
					</div>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type={showConfirmPassword ? "text" : "password"}
						autoComplete="new-password"
						required
						value={confirmPassword}
						onChange={handleConfirmPasswordChange}
						onBlur={handleConfirmPasswordBlur}
						placeholder="••••••••"
						className={`h-11 pr-20 pl-10 transition-all duration-200 ${
							hasConfirmPasswordError
								? "border-red-500 focus-visible:ring-red-500"
								: isConfirmPasswordValid
									? "border-green-500 focus-visible:ring-green-500"
									: "focus-visible:ring-blue-600"
						}`}
						aria-invalid={!!hasConfirmPasswordError}
						aria-describedby={
							hasConfirmPasswordError ? "confirm-password-error" : undefined
						}
					/>
					<div className="-translate-y-1/2 absolute top-1/2 right-3 flex items-center gap-2">
						{touched.confirmPassword &&
							(isConfirmPasswordValid ? (
								<CheckCircle2 className="fade-in zoom-in h-5 w-5 animate-in text-green-600 duration-200" />
							) : hasConfirmPasswordError ? (
								<XCircle className="fade-in zoom-in h-5 w-5 animate-in text-red-500 duration-200" />
							) : null)}
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="text-muted-foreground transition-colors hover:text-foreground"
							aria-label={
								showConfirmPassword ? "Hide password" : "Show password"
							}
						>
							{showConfirmPassword ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>
				{hasConfirmPasswordError && (
					<p
						id="confirm-password-error"
						className="slide-in-from-top-1 flex animate-in items-center gap-1 text-red-600 text-sm duration-200"
					>
						<XCircle className="h-3.5 w-3.5" />
						{confirmPasswordError}
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
						Creating account...
					</span>
				) : (
					"Create account"
				)}
			</Button>

			<div className="text-center">
				<p className="text-muted-foreground text-sm">
					Already have an account?{" "}
					<a
						href="/login"
						className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
					>
						Sign in
					</a>
				</p>
			</div>
		</form>
	);
}
