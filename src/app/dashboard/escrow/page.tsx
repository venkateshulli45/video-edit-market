"use client";

import React from "react";
import { Calendar, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/components/dashboard-context";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function EscrowPage() {
	const { session, contracts } = useDashboard();

	// Filter client's contracts
	const clientContracts = contracts.filter(
		(c) => c.clientId === session?.userId,
	);

	const totalInvested = clientContracts.reduce(
		(sum, c) => sum + Number(c.agreedPrice),
		0,
	);
	const activeCount = clientContracts.filter(
		(c) => c.status === "active",
	).length;
	const completedCount = clientContracts.filter(
		(c) => c.status === "completed",
	).length;

	return (
		<div className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
						Milestones & Escrow Contracts
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">
						Review and manage your funded contracts currently held in escrow.
					</p>
				</div>
				<Link
					href="/dashboard"
					className={cn(
						buttonVariants({ variant: "default" }),
						"bg-purple-650 hover:bg-purple-555 text-white font-bold self-start",
					)}
				>
					Back to Dashboard
				</Link>
			</header>

			{/* Escrow summary stat cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardContent className="pt-6 flex items-center space-x-4">
						<div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
							<CreditCard className="h-6 w-6" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
								Total Funded Escrow
							</p>
							<p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
								${totalInvested.toFixed(2)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardContent className="pt-6 flex items-center space-x-4">
						<div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
								Active Projects
							</p>
							<p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
								{activeCount}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardContent className="pt-6 flex items-center space-x-4">
						<div className="p-3 rounded-lg bg-green-500/10 text-green-400">
							<CheckCircle2 className="h-6 w-6" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
								Completed Contracts
							</p>
							<p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
								{completedCount}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* List of Contracts */}
			{clientContracts.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400/70">
					<p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">
						No active project contracts
					</p>
					<p className="text-sm mt-1">
						Contracts will appear here once you accept a proposal from a service
						provider.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{clientContracts.map((c) => (
						<Card
							key={c.id}
							className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xs transition-all p-5"
						>
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div className="space-y-1">
									<h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
										{c.jobTitle}
									</h4>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										Assigned Editor:{" "}
										<span className="font-semibold text-slate-700 dark:text-slate-300">
											{c.providerName}
										</span>
									</p>
									<p className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1 mt-1">
										<Calendar className="h-3.5 w-3.5" />
										<span>
											Started: {new Date(c.startedAt).toLocaleDateString()}
										</span>
									</p>
								</div>
								<div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 gap-2">
									<p className="text-xl font-extrabold text-purple-400">
										${Number(c.agreedPrice).toFixed(2)}
									</p>
									<span
										className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
											c.status === "completed"
												? "bg-green-500/10 text-green-400"
												: c.status === "active"
													? "bg-yellow-500/10 text-yellow-400"
													: "bg-slate-550 text-slate-400"
										}`}
									>
										{c.status}
									</span>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
