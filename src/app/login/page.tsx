"use client";

import { Eye, EyeOff, Lock, Mail, Moon, Shield, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Button } from "@/components/ui/button";
import { resolvePostLoginPath } from "@/lib/post-login-redirect";
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

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background" />
			}
		>
			<LoginPageContent />
		</Suspense>
	);
}

function LoginPageContent() {
	const { theme, setTheme } = useTheme();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [mounted, setMounted] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

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

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email || !password) {
			toast.error("Please enter email and password");
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Authentication failed");
			}

			toast.success("Login successful!");

			const roles = data.user.roles || [];
			setTimeout(() => {
				router.push(resolvePostLoginPath(roles));
			}, 1000);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || "Invalid credentials");
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
					className="absolute top-4 right-4 z-50 p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all shadow-md cursor-pointer"
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

			{/* Decorative gradient glowing spheres */}
			<div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

			<Card className="w-full max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 backdrop-blur-xl shadow-2xl relative z-10 text-slate-900 dark:text-slate-100">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-2">
						<div className="rounded-full bg-linear-to-r from-purple-500 to-blue-500 p-2 text-slate-900 dark:text-slate-100">
							<Shield className="h-6 w-6" />
						</div>
					</div>
					<CardTitle className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
						Welcome Back
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Sign in to access your marketplace dashboard
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4 pb-0">
					<GoogleAuthButton href="/api/auth/google?mode=login" disabled={isLoading} />
					<div className="relative py-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-slate-200 dark:border-slate-800" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
								or sign in with email
							</span>
						</div>
					</div>
				</CardContent>

				<form onSubmit={handleLogin}>
					<CardContent className="space-y-4">
						{/* Email Address */}
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
									className="absolute right-3 top-3 text-slate-500 dark:text-slate-400/70 hover:text-slate-500 dark:text-slate-400"
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<div className="flex items-center justify-between text-sm">
							<label className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 cursor-pointer select-none">
								<input
									type="checkbox"
									className="rounded border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 accent-purple-500"
									disabled={isLoading}
								/>
								<span>Remember me</span>
							</label>
							<Link
								href="#"
								className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
							>
								Forgot password?
							</Link>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<Button
							type="submit"
							className="w-full bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-900 dark:text-slate-100 font-bold py-6 text-base rounded-xl transition-all duration-300 shadow-xl shadow-purple-950/20 active:scale-[0.98]"
							disabled={isLoading}
						>
							{isLoading ? "Signing In..." : "Sign In"}
						</Button>
						<p className="text-center text-sm text-slate-500 dark:text-slate-400">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="text-purple-400 hover:text-purple-300 hover:underline font-semibold"
							>
								Register & Request Access
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
