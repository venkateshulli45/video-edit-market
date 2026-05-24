"use client";

import { Clock, LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function AwaitingApprovalPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const checkStatus = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/auth/session");
			const data = await response.json();

			if (!data.user) {
				router.push("/login");
				return;
			}

			const roles = data.user.roles || [];
			const hasAdmin = roles.some(
				(r: { name: string; status: string }) =>
					r.name === "ADMIN" && r.status === "approved",
			);
			const hasApprovedRole = roles.some(
				(r: { status: string }) => r.status === "approved",
			);

			if (hasAdmin) {
				toast.success("Admin role approved! Redirecting...");
				setTimeout(() => router.push("/admin"), 1500);
			} else if (hasApprovedRole) {
				toast.success("Role approved! Redirecting to dashboard...");
				setTimeout(() => router.push("/dashboard"), 1500);
			} else {
				toast.info("Status check: Still awaiting admin approval.");
			}
		} catch {
			toast.error("Failed to check status.");
		} finally {
			setIsLoading(false);
		}
	}, [router]);

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.push("/login");
		} catch {
			toast.error("Failed to sign out.");
		}
	};

	// Run initial status check on load
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		checkStatus();
	}, [checkStatus]);

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black overflow-hidden px-4">
			<Toaster position="top-center" richColors />

			<div className="absolute top-1/4 left-1/3 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

			<Card className="w-full max-w-md border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative z-10 text-slate-100 text-center">
				<CardHeader className="space-y-3">
					<div className="flex justify-center">
						<div className="rounded-full bg-yellow-500/10 p-4 text-yellow-500 animate-pulse">
							<Clock className="h-12 w-12" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold text-slate-100">
						Awaiting Admin Approval
					</CardTitle>
					<CardDescription className="text-slate-400">
						Your workspace registration request is currently under review
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 text-sm text-slate-400 text-left space-y-2">
						<div className="flex items-start space-x-2">
							<ShieldAlert className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
							<span>
								To ensure platform safety, all new user registrations (Clients
								and Editors) must be approved by an administrator before gaining
								workspace dashboard access.
							</span>
						</div>
					</div>
					<p className="text-xs text-slate-500">
						Standard reviews are processed in under 24 hours. You can click
						below to refresh and check if your access has been granted.
					</p>
				</CardContent>

				<CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
					<Button
						onClick={checkStatus}
						className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-5 rounded-lg border border-slate-700 transition-all flex items-center justify-center space-x-2"
						disabled={isLoading}
					>
						<RefreshCw
							className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
						/>
						<span>Check Status</span>
					</Button>

					<Button
						onClick={handleLogout}
						className="w-full sm:flex-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 font-semibold py-5 rounded-lg transition-all flex items-center justify-center space-x-2"
						disabled={isLoading}
					>
						<LogOut className="h-4 w-4" />
						<span>Sign Out</span>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
