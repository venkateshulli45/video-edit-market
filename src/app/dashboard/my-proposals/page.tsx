"use client";

import { Award, Clock, Pencil, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MyProposalsPage() {
	const { myProposals, fetchProviderData } = useDashboard();

	useEffect(() => {
		fetchProviderData();
	}, [fetchProviderData]);

	return (
		<div className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
						My Proposals & Bids
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">
						Track the status of all bids you have submitted to prospective
						clients.
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

			{/* List of Proposals */}
			{myProposals.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400/70">
					<p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">
						No bids submitted yet
					</p>
					<p className="text-sm mt-1">
						Find job openings in the browse page and place your first proposal.
					</p>
					<Link
						href="/dashboard/browse-jobs"
						className={cn(
							buttonVariants({ variant: "default", size: "sm" }),
							"mt-4 bg-blue-650 hover:bg-blue-555 text-white font-bold text-xs",
						)}
					>
						Browse Available Jobs
					</Link>
				</div>
			) : (
				<div className="space-y-4">
					{myProposals.map((prop) => (
						<Card
							key={prop.id}
							className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-350 dark:hover:border-slate-700 transition-all space-y-4"
						>
							<div className="flex justify-between items-start gap-4">
								<div>
									<h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
										{prop.jobTitle}
									</h4>
									<p className="text-xs text-slate-500 dark:text-slate-400/70 mt-1 flex items-center gap-1">
										<Award className="h-3.5 w-3.5" />
										<span>Client: {prop.clientName}</span>
									</p>
								</div>
								<div className="text-right shrink-0">
									<p className="text-lg font-extrabold text-blue-400">
										${Number(prop.bidAmount).toFixed(2)}
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400/70 mt-0.5 flex items-center justify-end gap-1 font-semibold">
										<Clock className="h-3.5 w-3.5 text-blue-400" />
										<span>
											{prop.estimatedDays
												? `${prop.estimatedDays} days delivery`
												: "Negotiated time"}
										</span>
									</p>
								</div>
							</div>

							<div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-650 dark:text-slate-350 italic">
								Your pitch: &quot;{prop.proposalText}&quot;
							</div>

							<div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs gap-3">
								<span className="text-slate-400">
									{prop.status === "pending"
										? "Awaiting client review — you can still edit"
										: "Submission status:"}
								</span>
								<div className="flex items-center gap-2 shrink-0">
									{prop.status === "accepted" && prop.jobId && (
										<Link
											href={`/dashboard/deliver-work/${prop.jobId}`}
											className={cn(
												buttonVariants({ variant: "default", size: "sm" }),
												"h-auto py-1 px-2.5 text-xs font-semibold flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white",
											)}
										>
											<Upload className="h-3 w-3" />
											Upload Work
										</Link>
									)}
									{prop.status === "pending" && prop.jobId && (
										<Link
											href={`/dashboard/edit-bid/${prop.jobId}`}
											className={cn(
												buttonVariants({ variant: "outline", size: "sm" }),
												"h-auto py-1 px-2.5 text-xs font-semibold flex items-center gap-1 border-blue-500/40 text-blue-500",
											)}
										>
											<Pencil className="h-3 w-3" />
											Edit Bid
										</Link>
									)}
									<span
										className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
											prop.status === "accepted"
												? "bg-green-500/10 text-green-400"
												: prop.status === "rejected"
													? "bg-red-500/10 text-red-400"
													: "bg-yellow-500/10 text-yellow-400"
										}`}
									>
										{prop.status}
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
