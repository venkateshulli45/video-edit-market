"use client";

import { Clock, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function BrowseJobsPage() {
	const { availableJobs, fetchProviderData, loadCategories } = useDashboard();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("");

	useEffect(() => {
		fetchProviderData();
		loadCategories();
	}, [fetchProviderData, loadCategories]);

	const filteredJobs = availableJobs.filter((job) => {
		const titleMatch = job.title
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const descMatch = job.description
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const categoryMatch =
			selectedCategory === "" || job.category.name === selectedCategory;
		return (titleMatch || descMatch) && categoryMatch;
	});

	// Get list of category names for filter dropdown
	const categoryList = Array.from(
		new Set(availableJobs.map((j) => j.category.name)),
	);

	return (
		<div className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
						Browse Available Jobs
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">
						Submit proposals and place bids on active marketplace contract
						requests.
					</p>
				</div>
				<Link
					href="/dashboard"
					className={cn(
						buttonVariants({ variant: "default" }),
						"bg-blue-600 hover:bg-blue-500 text-white font-bold self-start",
					)}
				>
					Back to Dashboard
				</Link>
			</header>

			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
				<div className="relative flex-1">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500"
						placeholder="Search by keywords..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<select
					className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:w-56"
					value={selectedCategory}
					onChange={(e) => setSelectedCategory(e.target.value)}
				>
					<option value="">All Categories</option>
					{categoryList.map((catName) => (
						<option key={catName} value={catName}>
							{catName}
						</option>
					))}
				</select>
			</div>

			{/* Job Postings */}
			{filteredJobs.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400/70">
					<p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">
						No job postings available
					</p>
					<p className="text-sm mt-1">
						Try adjusting your search criteria or check back later for new
						requests.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{filteredJobs.map((job) => (
						<Card
							key={job.id}
							className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-xs transition-all"
						>
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div className="space-y-2 flex-1">
									<span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-bold">
										{job.category.name}
									</span>
									<h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg mt-2">
										{job.title}
									</h4>
									<p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
										{job.description}
									</p>

									<div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
										<span className="flex items-center gap-1">
											<Clock className="h-3.5 w-3.5 text-blue-400" />
											<span>
												Deadline:{" "}
												{job.deadline
													? new Date(job.deadline).toLocaleDateString()
													: "No deadline"}
											</span>
										</span>
										{job.location && (
											<span className="flex items-center gap-1">
												<Clock className="h-3.5 w-3.5 text-blue-400" />
												<span>{job.location}</span>
											</span>
										)}
									</div>
								</div>

								<div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 gap-3">
									<div className="text-right">
										<p className="text-xl font-extrabold text-blue-400">
											${Number(job.budget).toFixed(2)}
										</p>
										<p className="text-2xs text-slate-500 dark:text-slate-400/70 capitalize font-medium">
											{job.pricingModel} model
										</p>
									</div>

									{job.canEditBid ? (
										<Link
											href={`/dashboard/edit-bid/${job.id}`}
											className={cn(
												buttonVariants({ variant: "outline", size: "sm" }),
												"border-yellow-500/40 text-yellow-600 dark:text-yellow-400 font-bold px-4 py-1.5 h-auto text-xs",
											)}
										>
											Edit Bid (Pending)
										</Link>
									) : job.hasBid ? (
										<span className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold">
											Proposal Submitted
										</span>
									) : (
										<Link
											href={`/dashboard/submit-bid/${job.id}`}
											className={cn(
												buttonVariants({ variant: "default", size: "sm" }),
												"bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 h-auto text-xs shadow-xs",
											)}
										>
											Submit Bid
										</Link>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
