"use client";

import {
	Award,
	CheckCircle2,
	ChevronRight,
	Clock,
	Eye,
	MessageSquareQuote,
	Pencil,
	Star,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { type Proposal, useDashboard } from "@/components/dashboard-context";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProposalWithMeta extends Proposal {
	contractStatus?: string | null;
	clientReview?: {
		overallRating: number;
		comment: string | null;
	} | null;
}

export default function MyProposalsPage() {
	const { myProposals, fetchProviderData } = useDashboard();
	const enriched = myProposals as ProposalWithMeta[];

	useEffect(() => {
		fetchProviderData();
	}, [fetchProviderData]);

	const getAssignmentState = (prop: ProposalWithMeta) => {
		const jobDone = prop.jobStatus === "completed";
		const contractDone = prop.contractStatus === "completed";
		return {
			isComplete: jobDone || contractDone,
			canUpload: prop.status === "accepted" && !jobDone && !contractDone,
		};
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
						My Proposals & Bids
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">
						Track bids, upload work, and read client feedback on completed
						projects.
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

			{enriched.length === 0 ? (
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
					{enriched.map((prop) => {
						const { isComplete, canUpload } = getAssignmentState(prop);
						const assignmentHref =
							prop.status === "accepted" && prop.jobId
								? `/dashboard/deliver-work/${prop.jobId}`
								: null;

						return (
							<Card
								key={prop.id}
								className={cn(
									"border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all space-y-4",
									assignmentHref &&
										"hover:border-blue-400/50 dark:hover:border-blue-600/50 cursor-pointer group",
									isComplete && "ring-1 ring-green-500/20 border-green-500/20",
								)}
							>
								{assignmentHref ? (
									<Link href={assignmentHref} className="block space-y-4">
										<ProposalCardBody
											prop={prop}
											isComplete={isComplete}
											showChevron
										/>
									</Link>
								) : (
									<ProposalCardBody prop={prop} isComplete={isComplete} />
								)}

								<div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs gap-3">
									<span className="text-slate-400">
										{prop.status === "pending"
											? "Awaiting client review — you can still edit"
											: isComplete
												? "Project completed"
												: "Submission status:"}
									</span>
									<div className="flex items-center gap-2 shrink-0">
										{canUpload && prop.jobId && (
											<Link
												href={`/dashboard/deliver-work/${prop.jobId}`}
												className={cn(
													buttonVariants({ variant: "default", size: "sm" }),
													"h-auto py-1 px-2.5 text-xs font-semibold flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white",
												)}
											>
												<Upload className="h-3 w-3" />
												Upload work
											</Link>
										)}
										{isComplete && prop.jobId && (
											<Link
												href={`/dashboard/deliver-work/${prop.jobId}`}
												className={cn(
													buttonVariants({ variant: "outline", size: "sm" }),
													"h-auto py-1 px-2.5 text-xs font-semibold flex items-center gap-1 border-green-500/40 text-green-600 dark:text-green-400",
												)}
											>
												<Eye className="h-3 w-3" />
												View assignment
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
												Edit bid
											</Link>
										)}
										<span
											className={cn(
												"px-3 py-1 rounded-full text-xs font-bold capitalize",
												prop.status === "accepted" &&
													(isComplete
														? "bg-green-500/10 text-green-600 dark:text-green-400"
														: "bg-green-500/10 text-green-400"),
												prop.status === "rejected" &&
													"bg-red-500/10 text-red-400",
												prop.status === "pending" &&
													"bg-yellow-500/10 text-yellow-400",
											)}
										>
											{isComplete && prop.status === "accepted"
												? "Completed"
												: prop.status}
										</span>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}

function ProposalCardBody({
	prop,
	isComplete,
	showChevron,
}: {
	prop: ProposalWithMeta;
	isComplete: boolean;
	showChevron?: boolean;
}) {
	return (
		<>
			<div className="flex justify-between items-start gap-4">
				<div className="min-w-0 flex-1">
					<h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
						{prop.jobTitle}
						{showChevron && (
							<ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
						)}
					</h4>
					<p className="text-xs text-slate-500 dark:text-slate-400/70 mt-1 flex items-center gap-1">
						<Award className="h-3.5 w-3.5 shrink-0" />
						<span>Client: {prop.clientName}</span>
					</p>
					{isComplete && (
						<p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 flex items-center gap-1">
							<CheckCircle2 className="h-3.5 w-3.5" />
							Client accepted your work
						</p>
					)}
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

			{prop.clientReview && (
				<div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30 p-3 space-y-1">
					<p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
						<MessageSquareQuote className="h-3.5 w-3.5" />
						Client feedback
						<span className="inline-flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400 ml-1">
							<Star className="h-3 w-3 fill-current" />
							{prop.clientReview.overallRating.toFixed(1)}
						</span>
					</p>
					{prop.clientReview.comment && (
						<p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
							&ldquo;{prop.clientReview.comment}&rdquo;
						</p>
					)}
					<p className="text-2xs text-amber-700/80 dark:text-amber-400/80">
						Click card for full details
					</p>
				</div>
			)}
		</>
	);
}
