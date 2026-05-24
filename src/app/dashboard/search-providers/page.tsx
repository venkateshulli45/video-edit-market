"use client";

import { Award, Search, Star } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { StartChatButton } from "@/components/start-chat-button";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SearchProvidersPage() {
	const { providers, loadProviders } = useDashboard();
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		loadProviders();
	}, [loadProviders]);

	const filteredProviders = providers.filter((p) => {
		const nameMatch = p.fullName
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const bioMatch =
			p.bio?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
		const skillsMatch = p.skills.some((skill) =>
			skill.toLowerCase().includes(searchQuery.toLowerCase()),
		);
		return nameMatch || bioMatch || skillsMatch;
	});

	return (
		<div className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
						Expert Service Providers
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">
						Browse and connect with top freelance editors, consultants, and
						experts.
					</p>
				</div>
				<Link
					href="/dashboard"
					className={cn(
						buttonVariants({ variant: "default" }),
						"bg-purple-650 hover:bg-purple-555 text-white font-bold",
					)}
				>
					Back to Dashboard
				</Link>
			</header>

			{/* Search Filter Bar */}
			<div className="relative max-w-md">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
				<Input
					className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-purple-500"
					placeholder="Search by name, skill, or biography..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{/* Listings */}
			{filteredProviders.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400/70">
					<p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">
						No service providers found
					</p>
					<p className="text-sm mt-1">
						Try adjusting your search terms or view the full list later.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{filteredProviders.map((p) => (
						<Card
							key={p.id}
							className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-purple-500/20 transition-all duration-300 p-5 flex flex-col justify-between"
						>
							<div className="space-y-3">
								<div className="flex justify-between items-start gap-4">
									<div>
										<h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-1.5">
											<Award className="h-5 w-5 text-purple-500" />
											<span>{p.fullName}</span>
										</h4>
										<p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
											{p.bio || "No biography provided."}
										</p>
									</div>
									<div className="text-right shrink-0">
										{p.hourlyRate ? (
											<p className="text-lg font-bold text-purple-400">
												${Number(p.hourlyRate).toFixed(2)}/hr
											</p>
										) : (
											<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
												Negotiable
											</p>
										)}
										<div className="flex items-center justify-end text-yellow-400 text-xs font-semibold gap-1 mt-1">
											<Star className="h-3.5 w-3.5 fill-current" />
											<span>{Number(p.averageRating).toFixed(2)}</span>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
								<div className="flex flex-wrap gap-1.5">
									{p.skills.length > 0 ? (
										p.skills.map((s) => (
											<span
												key={s}
												className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
											>
												{s}
											</span>
										))
									) : (
										<span className="text-xs text-slate-400 italic">
											No skills listed
										</span>
									)}
								</div>
								<StartChatButton
									targetUserId={p.userId}
									targetName={p.fullName}
									className="border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 shrink-0"
								/>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
