"use client";

import { Eye, EyeOff, Film, Lock, Mail, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolvePostLoginPath } from "@/lib/post-login-redirect";

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-[#080c14]" />
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
		const t = setTimeout(() => setMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		const error = searchParams.get("error");
		if (error) toast.error(error);
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
			if (!response.ok) throw new Error(data.error || "Authentication failed");
			toast.success("Login successful!");
			const roles = data.user.roles || [];
			setTimeout(() => router.push(resolvePostLoginPath(roles)), 1000);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || "Invalid credentials");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className="relative min-h-screen flex items-center justify-center overflow-hidden"
			style={{
				backgroundImage: "url('/login-bg.png')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			{/* Dark overlay for readability */}
			<div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

			{/* Animated neon glow orbs */}
			<div className="absolute top-1/4 left-1/4 w-125 h-125 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
			<div
				className="absolute bottom-1/4 right-1/4 w-100 h-100 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse"
				style={{ animationDelay: "1.5s" }}
			/>
			<div
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-50 bg-blue-700/10 rounded-full blur-[80px] pointer-events-none animate-pulse"
				style={{ animationDelay: "0.8s" }}
			/>

			<Toaster position="top-center" richColors />

			{/* Theme toggle */}
			{mounted && (
				<button
					type="button"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="absolute top-5 right-5 z-50 p-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-lg cursor-pointer"
					title="Toggle theme"
				>
					{theme === "dark" ? (
						<Sun className="h-4 w-4" />
					) : (
						<Moon className="h-4 w-4" />
					)}
				</button>
			)}

			{/* Left side — branding panel (hidden on mobile) */}
			<div className="hidden lg:flex flex-col justify-center items-start px-16 max-w-xl z-10 mr-8">
				{/* Logo + wordmark */}
				<div className="flex items-center gap-3 mb-8">
					<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30">
						<Film className="h-6 w-6 text-white" />
					</div>
					<div>
						<span className="text-2xl font-black text-white tracking-tight">
							Edit
							<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
								Market
							</span>
						</span>
						<p className="text-xs text-white/40 font-medium tracking-widest uppercase">
							Video Editing Marketplace
						</p>
					</div>
				</div>

				<h1 className="text-5xl font-black text-white leading-tight mb-4">
					Where editors
					<br />
					<span className="bg-linear-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
						meet opportunity.
					</span>
				</h1>
				<p className="text-white/50 text-lg leading-relaxed mb-8">
					Connect with top-tier clients, showcase your reel, and land high-value
					video editing contracts — all in one place.
				</p>

				{/* Stat pills */}
				<div className="flex items-center gap-4 flex-wrap">
					{[
						{ val: "2,400+", label: "Active editors" },
						{ val: "$3.2M", label: "Paid out" },
						{ val: "98%", label: "Client satisfaction" },
					].map((s) => (
						<div
							key={s.label}
							className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
						>
							<span className="text-white font-bold text-sm">{s.val}</span>
							<span className="text-white/40 text-xs ml-1.5">{s.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Login card */}
			<div className="relative z-10 w-full max-w-md px-4">
				{/* Mobile logo */}
				<div className="flex lg:hidden items-center gap-3 mb-6 justify-center">
					<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30">
						<Film className="h-5 w-5 text-white" />
					</div>
					<span className="text-xl font-black text-white tracking-tight">
						Edit
						<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
							Market
						</span>
					</span>
				</div>

				<div
					className="rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
					style={{
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
						backdropFilter: "blur(24px)",
						WebkitBackdropFilter: "blur(24px)",
					}}
				>
					{/* Card top accent bar */}
					<div className="h-0.5 w-full bg-linear-to-r from-violet-500 via-pink-500 to-cyan-500" />

					<div className="p-8">
						{/* Header */}
						<div className="mb-7">
							<h2 className="text-2xl font-extrabold text-white mb-1">
								Welcome back
							</h2>
							<p className="text-white/40 text-sm">
								Sign in to your EditMarket account
							</p>
						</div>

						{/* Google */}
						<div className="mb-5">
							<GoogleAuthButton
								href="/api/auth/google?mode=login"
								disabled={isLoading}
							/>
						</div>

						{/* Divider */}
						<div className="flex items-center gap-3 mb-5">
							<div className="flex-1 h-px bg-white/10" />
							<span className="text-white/30 text-xs uppercase tracking-widest">
								or
							</span>
							<div className="flex-1 h-px bg-white/10" />
						</div>

						<form onSubmit={handleLogin} className="space-y-4">
							{/* Email */}
							<div className="space-y-1.5">
								<Label
									htmlFor="email"
									className="text-white/60 text-sm font-medium"
								>
									Email Address
								</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-3 h-4 w-4 text-violet-300" />
									<Input
										id="email"
										type="email"
										placeholder="name@example.com"
										className="pl-10 border rounded-xl h-11 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
										style={{
											background: "rgba(255,255,255,0.07)",
											borderColor: "rgba(255,255,255,0.12)",
											color: "white",
										}}
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={isLoading}
										required
									/>
								</div>
							</div>

							{/* Password */}
							<div className="space-y-1.5">
								<Label
									htmlFor="password"
									className="text-white/60 text-sm font-medium"
								>
									Password
								</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-3 h-4 w-4 text-violet-300" />
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="••••••••"
										className="pl-10 pr-10 border rounded-xl h-11 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
										style={{
											background: "rgba(255,255,255,0.07)",
											borderColor: "rgba(255,255,255,0.12)",
											color: "white",
										}}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										disabled={isLoading}
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-3 text-violet-300 hover:text-white transition-colors"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							{/* Remember / forgot */}
							<div className="flex items-center justify-between text-sm">
								<label className="flex items-center gap-2 text-white/40 cursor-pointer select-none">
									<input
										type="checkbox"
										className="rounded border-white/10 bg-white/5 accent-violet-500"
										disabled={isLoading}
									/>
									<span>Remember me</span>
								</label>
								<Link
									href="#"
									className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
								>
									Forgot password?
								</Link>
							</div>

							{/* Submit */}
							<Button
								type="submit"
								className="w-full h-12 rounded-xl font-bold text-base text-white bg-linear-to-r from-violet-600 via-purple-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-900/40 transition-all duration-300 active:scale-[0.98] mt-2 border-0"
								disabled={isLoading}
							>
								{isLoading ? (
									<span className="flex items-center gap-2">
										<span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Signing In...
									</span>
								) : (
									"Sign In"
								)}
							</Button>
						</form>

						{/* Footer */}
						<p className="text-center text-sm text-white/30 mt-5">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
							>
								Register &amp; Request Access
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
