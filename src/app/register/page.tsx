"use client";

import {
	Briefcase,
	Check,
	Eye,
	EyeOff,
	Lock,
	Mail,
	Moon,
	Sun,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background" />
			}
		>
			<RegisterPageContent />
		</Suspense>
	);
}

function RegisterPageContent() {
	const { theme, setTheme } = useTheme();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [mounted, setMounted] = useState(false);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const googleAuthHref =
		selectedRoles.length > 0
			? `/api/auth/google?mode=register&roles=${encodeURIComponent(selectedRoles.join(","))}&fullName=${encodeURIComponent(fullName.trim())}`
			: "";

	useEffect(() => {
		const t = setTimeout(() => {
			setMounted(true);
		}, 0);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		const error = searchParams.get("error");
		if (error) {
			toast.error(error);
		}
	}, [searchParams]);

	const toggleRole = (role: string) => {
		setSelectedRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
		);
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!fullName || !email || !password) {
			toast.error("Please fill in all details");
			return;
		}

		if (selectedRoles.length === 0) {
			toast.error("Please select at least one role to request access");
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fullName,
					email,
					password,
					requestedRoles: selectedRoles,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Something went wrong");
			}

			toast.success("Account created successfully!");
			toast.info("Awaiting administrator approval for requested roles.");

			// Redirect to login after delay
			setTimeout(() => {
				router.push("/login");
			}, 2500);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || "Registration failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-linear-to-b from-background via-muted/40 to-background overflow-hidden px-4">
			{mounted && (
				<button
					type="button"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="absolute top-4 right-4 z-50 p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-md text-slate-500 hover:text-slate-900 dark:text-slate-100 transition-all shadow-md cursor-pointer"
					title="Toggle theme"
				>
					{theme === "dark" ? (
						<Sun className="h-4.5 w-4.5" />
					) : (
						<Moon className="h-4.5 w-4.5" />
					)}
				</button>
			)}
			<Toaster position="top-center" richColors />

			{/* Background gradients */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

			<Card className="w-full max-w-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 backdrop-blur-xl shadow-2xl relative z-10 text-slate-900 dark:text-slate-100">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
						Create an Account
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Sign up and request workspace roles to begin
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleRegister}>
					<CardContent className="space-y-6">
						{/* Full Name */}
						<div className="space-y-2">
							<Label
								htmlFor="fullName"
								className="text-slate-500 dark:text-slate-400 font-medium"
							>
								Full Name
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-400/70" />
								<Input
									id="fullName"
									placeholder="John Doe"
									className="pl-10 bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder-slate-500"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									disabled={isLoading}
									required
								/>
							</div>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label
								htmlFor="email"
								className="text-slate-500 dark:text-slate-400 font-medium"
							>
								Email Address
							</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-400/70" />
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
									className="pl-10 bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder-slate-500"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isLoading}
									required
								/>
							</div>
						</div>

						{/* Password */}
						<div className="space-y-2">
							<Label
								htmlFor="password"
								className="text-slate-500 dark:text-slate-400 font-medium"
							>
								Password
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-400/70" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									className="pl-10 pr-10 bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder-slate-500"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isLoading}
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-3 text-slate-500 dark:text-slate-400/70 hover:text-slate-500"
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{/* Role selection Cards */}
						<div className="space-y-3">
							<Label className="text-slate-500 dark:text-slate-400 font-medium">
								Select Workspace Roles (Request Access)
							</Label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Client Role */}
								<button
									type="button"
									onClick={() => !isLoading && toggleRole("CLIENT")}
									className={`text-left w-full cursor-pointer rounded-xl border p-4 flex items-start space-x-3 transition-all duration-300 ${
										selectedRoles.includes("CLIENT")
											? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5"
											: "border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-800/20 hover:border-slate-700 hover:bg-slate-100"
									}`}
								>
									<div
										className={`mt-0.5 rounded-full p-2 ${selectedRoles.includes("CLIENT") ? "bg-purple-500 text-slate-900 dark:text-slate-100" : "bg-slate-800 text-slate-500 dark:text-slate-400"}`}
									>
										<User className="h-5 w-5" />
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-slate-900 dark:text-slate-100">
												Client / Buyer
											</span>
											{selectedRoles.includes("CLIENT") && (
												<Check className="h-4 w-4 text-purple-400" />
											)}
										</div>
										<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
											Post projects, hire experts, and manage orders
										</p>
									</div>
								</button>

								{/* Provider Role */}
								<button
									type="button"
									onClick={() => !isLoading && toggleRole("PROVIDER")}
									className={`text-left w-full cursor-pointer rounded-xl border p-4 flex items-start space-x-3 transition-all duration-300 ${
										selectedRoles.includes("PROVIDER")
											? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5"
											: "border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-800/20 hover:border-slate-700 hover:bg-slate-100"
									}`}
								>
									<div
										className={`mt-0.5 rounded-full p-2 ${selectedRoles.includes("PROVIDER") ? "bg-blue-500 text-slate-900 dark:text-slate-100" : "bg-slate-800 text-slate-500 dark:text-slate-400"}`}
									>
										<Briefcase className="h-5 w-5" />
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-slate-900 dark:text-slate-100">
												Editor / Expert
											</span>
											{selectedRoles.includes("PROVIDER") && (
												<Check className="h-4 w-4 text-blue-400" />
											)}
										</div>
										<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
											Submit bids, deliver work, and get paid securely
										</p>
									</div>
								</button>
							</div>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<GoogleAuthButton
							href={googleAuthHref || "#"}
							disabled={isLoading || selectedRoles.length === 0}
							label="Continue with Google"
						/>
						{selectedRoles.length === 0 && (
							<p className="text-xs text-center text-slate-500 dark:text-slate-400">
								Select at least one role above to use Google sign-up.
							</p>
						)}
						<div className="relative py-1">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-slate-200 dark:border-slate-800" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
									or register with email
								</span>
							</div>
						</div>
						<Button
							type="submit"
							className="w-full bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-900 dark:text-slate-100 font-bold py-6 text-base rounded-xl transition-all duration-300 shadow-xl shadow-purple-950/20 active:scale-[0.98]"
							disabled={isLoading}
						>
							{isLoading
								? "Submitting Registration..."
								: "Request Registration Access"}
						</Button>
						<p className="text-center text-sm text-slate-500 dark:text-slate-400">
							Already have an account?{" "}
							<Link
								href="/login"
								className="text-purple-400 hover:text-purple-300 hover:underline font-semibold"
							>
								Sign In
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
