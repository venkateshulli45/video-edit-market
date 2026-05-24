"use client";

import {
	Briefcase,
	Calendar,
	Clock,
	FileText,
	MapPin,
	Plus,
	Search,
	User,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/components/dashboard-context";
import { StartChatButton } from "@/components/start-chat-button";
import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
	const {
		session,
		activeView,
		postedJobs,
		contracts,
		myProposals,
		providerProfile,
	} = useDashboard();

	// Filter client's contracts
	const clientContracts = contracts.filter(
		(c) => c.clientId === session?.userId,
	);
	// Filter editor's contracts
	const providerContracts = contracts.filter(
		(c) => c.providerId === session?.userId,
	);

	return (
		<div className="space-y-6">
			{/* Dynamic Header */}
			<header className="mb-8">
				<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
					Welcome to your Dashboard
				</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">
					Currently acting as a{" "}
					<span
						className={`font-bold uppercase ${
							activeView === "CLIENT" ? "text-purple-500" : "text-blue-500"
						}`}
					>
						{activeView === "CLIENT"
							? "Client / Buyer"
							: "Service Provider / Editor"}
					</span>
				</p>
			</header>

			{activeView === "CLIENT" ? (
				/* CLIENT DASHBOARD INTERFACE */
				<section className="space-y-6">
					{/* Quick Actions */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						<Link href="/dashboard/post-job" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
										<Plus className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
										Post a Service Request
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										Describe your project, upload requirements, and set budget.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>

						<Link href="/dashboard/search-providers" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
										<Search className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
										Search Service Providers
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										Browse experts by category, skills, and portfolio reviews.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>

						<Link href="/dashboard/escrow" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
										<Calendar className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
										Manage Escrow Milestones
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										Verify milestones, release funded payments, and view
										contracts.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>

						<Link href="/dashboard/edit-client-profile" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
										<User className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
										Edit Client Profile
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										Modify your display name, contact phone, and address.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>
					</div>

					{/* Main Content Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Active Jobs List */}
						<div
							id="client-posted-jobs"
							className="lg:col-span-2 space-y-4 scroll-mt-20"
						>
							<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
								<FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
								<span>Your Posted Jobs</span>
							</h3>

							{postedJobs.length === 0 ? (
								<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-800/10 p-12 text-center text-slate-500 dark:text-slate-400/70">
									<p className="font-semibold text-slate-500 dark:text-slate-400">
										No active job posts yet
									</p>
									<p className="text-xs mt-1">
										Get started by creating your first service request project!
									</p>
									<Link
										href="/dashboard/post-job"
										className={cn(
											buttonVariants({ variant: "default", size: "sm" }),
											"mt-4 bg-purple-650 hover:bg-purple-550 text-white font-bold text-xs",
										)}
									>
										Create Request
									</Link>
								</div>
							) : (
								<div className="space-y-4">
									{postedJobs.map((job) => (
										<Card
											key={job.id}
											className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
										>
											<div className="flex justify-between items-start">
												<div>
													<span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-semibold">
														{job.category.name}
													</span>
													<h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
														{job.title}
													</h4>
													<p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
														{job.description}
													</p>
												</div>
												<div className="text-right whitespace-nowrap">
													<span className="text-lg font-bold text-purple-400">
														${Number(job.budget).toFixed(2)}
													</span>
													<p className="text-xs text-slate-500 dark:text-slate-400/70 capitalize">
														{job.pricingModel} model
													</p>
												</div>
											</div>

											<div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 gap-2">
												<div className="flex space-x-4">
													<span className="flex items-center space-x-1">
														<Clock className="h-3.5 w-3.5" />
														<span>
															{job.deadline
																? new Date(job.deadline).toLocaleDateString()
																: "No deadline"}
														</span>
													</span>
													{job.location && (
														<span className="flex items-center space-x-1">
															<MapPin className="h-3.5 w-3.5" />
															<span>{job.location}</span>
														</span>
													)}
													<span
														className={`capitalize font-semibold ${
															job.status === "posted"
																? "text-yellow-400"
																: "text-green-400"
														}`}
													>
														Status: {job.status}
													</span>
												</div>

												<Link
													href={`/dashboard/view-bids/${job.id}`}
													className={cn(
														buttonVariants({ variant: "default", size: "sm" }),
														"bg-purple-650 hover:bg-purple-550 text-white font-bold px-3 py-1.5 h-auto text-xs",
													)}
												>
													View Bids ({job._count?.proposals || 0})
												</Link>
											</div>
										</Card>
									))}
								</div>
							)}
						</div>

						{/* Sidebar Info */}
						<div className="space-y-6">
							<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
								<CardHeader>
									<CardTitle className="text-md">Workspace Info</CardTitle>
									<CardDescription>Escrow contract status logs</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
									<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
										<span>Total Invested (Escrow):</span>
										<span className="text-slate-900 dark:text-slate-100 font-bold">
											$
											{clientContracts
												.reduce((sum, c) => sum + Number(c.agreedPrice), 0)
												.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
										<span>Active Assignments:</span>
										<span className="text-slate-900 dark:text-slate-100">
											{
												clientContracts.filter((c) => c.status === "active")
													.length
											}
										</span>
									</div>
									<div className="flex justify-between pb-2">
										<span>Total Contracts:</span>
										<span className="text-slate-900 dark:text-slate-100">
											{clientContracts.length}
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>
			) : (
				/* PROVIDER DASHBOARD INTERFACE */
				<section className="space-y-6">
					{/* Quick Actions */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Link href="/dashboard/browse-jobs" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
										<Search className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
										Browse Available Jobs
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										Find new clients seeking editing, design, or consulting
										work.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>

						<Link href="/dashboard/my-proposals" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
										<FileText className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
										My Proposals
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										View and track status updates on your submitted bids and
										pitches.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>

						<Link href="/dashboard/edit-profile" className="group">
							<Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer h-full">
								<CardHeader>
									<div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
										<User className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
										Edit Expert Profile
									</CardTitle>
									<CardDescription className="text-slate-500 dark:text-slate-400">
										Modify your bio, list expert skills, and showcase your
										portfolio.
									</CardDescription>
								</CardHeader>
							</Card>
						</Link>
					</div>

					{/* Main Content Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Proposals and assignments list */}
						<div
							id="provider-contracts"
							className="lg:col-span-2 space-y-4 scroll-mt-20"
						>
							<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
								<Briefcase className="h-5 w-5 text-slate-500 dark:text-slate-400" />
								<span>Active Assignments</span>
							</h3>

							{providerContracts.length === 0 ? (
								<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-800/10 p-12 text-center text-slate-500 dark:text-slate-400/70">
									<p className="font-semibold text-slate-500 dark:text-slate-400">
										No active assignments
									</p>
									<p className="text-xs mt-1">
										Start bidding on job openings to secure your first project
										assignment!
									</p>
									<Link
										href="/dashboard/browse-jobs"
										className={cn(
											buttonVariants({ variant: "default", size: "sm" }),
											"mt-4 bg-blue-650 hover:bg-blue-550 text-white font-bold text-xs",
										)}
									>
										Browse Jobs
									</Link>
								</div>
							) : (
								<div className="space-y-4">
									{providerContracts.map((c) => (
										<Card
											key={c.id}
											className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
										>
											<div className="flex justify-between items-start">
												<div>
													<span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold">
														Contract Assigned
													</span>
													<h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
														{c.jobTitle}
													</h4>
													<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
														{c.jobDescription}
													</p>
													<p className="text-xs text-slate-500 dark:text-slate-400/70 mt-2">
														Client: {c.clientName}
													</p>
												</div>
												<div className="text-right whitespace-nowrap flex flex-col items-end gap-2">
													<span className="text-lg font-bold text-blue-400">
														${Number(c.agreedPrice).toFixed(2)}
													</span>
													<p className="text-xs text-slate-500 dark:text-slate-400/70 capitalize">
														{c.status}
													</p>
													<StartChatButton
														targetUserId={c.clientId}
														targetName={c.clientName}
														className="border-blue-500/40 text-blue-600 dark:text-blue-400"
													/>
												</div>
											</div>
										</Card>
									))}
								</div>
							)}
						</div>

						{/* Sidebar Info */}
						<div className="space-y-6">
							<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
								<CardHeader>
									<CardTitle className="text-md">Profile Performance</CardTitle>
									<CardDescription>Reputation overview stats</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
									<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
										<span>Total Earnings:</span>
										<span className="text-slate-900 dark:text-slate-100 font-bold">
											$
											{providerContracts
												.filter((c) => c.status === "completed")
												.reduce((sum, c) => sum + Number(c.agreedPrice), 0)
												.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
										<span>Average Rating:</span>
										<span className="text-slate-900 dark:text-slate-100">
											{providerProfile?.averageRating
												? `${Number(providerProfile.averageRating).toFixed(2)} ★`
												: "0.00 ★"}
										</span>
									</div>
									<div className="flex justify-between pb-2">
										<span>Submitted Bids:</span>
										<span className="text-slate-900 dark:text-slate-100">
											{myProposals.length}
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
