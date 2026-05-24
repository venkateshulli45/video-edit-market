"use client";

import {
	ArrowLeft,
	Award,
	Calendar,
	Check,
	Pencil,
	Star,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type Proposal, useDashboard } from "@/components/dashboard-context";
import { StartChatButton } from "@/components/start-chat-button";
import { WorkUploadPanel } from "@/components/work-upload-panel";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PROPOSAL_SORT_ORDER: Record<Proposal["status"], number> = {
	accepted: 0,
	pending: 1,
	rejected: 2,
	withdrawn: 3,
};

export default function ViewBidsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();
	const {
		postedJobs,
		fetchClientData,
		isLoading: isDashboardLoading,
	} = useDashboard();
	const [jobProposals, setJobProposals] = useState<Proposal[]>([]);
	const [isLoadingProposals, setIsLoadingProposals] = useState(true);
	const [isActionSubmitting, setIsActionSubmitting] = useState(false);

	const job = postedJobs.find((j) => j.id === id);

	const sortedProposals = useMemo(
		() =>
			[...jobProposals].sort(
				(a, b) =>
					(PROPOSAL_SORT_ORDER[a.status] ?? 99) -
					(PROPOSAL_SORT_ORDER[b.status] ?? 99),
			),
		[jobProposals],
	);

	useEffect(() => {
		const fetchProposals = async () => {
			try {
				const res = await fetch(`/api/proposals?jobId=${id}`);
				if (res.ok) {
					const data = await res.json();
					setJobProposals(data.proposals || []);
				} else {
					const data = await res.json();
					toast.error(data.error || "Failed to load proposals");
				}
			} catch {
				toast.error("Failed to load proposals for job");
			} finally {
				setIsLoadingProposals(false);
			}
		};

		if (id) {
			fetchProposals();
		}
	}, [id]);

	const handleProposalAction = async (
		proposalId: string,
		action: "accept" | "reject",
	) => {
		setIsActionSubmitting(true);
		try {
			const res = await fetch("/api/proposals", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ proposalId, action }),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || `Bid ${action}ed successfully!`);
				await fetchClientData();
				// Refetch proposals
				const propRes = await fetch(`/api/proposals?jobId=${id}`);
				if (propRes.ok) {
					const propData = await propRes.json();
					setJobProposals(propData.proposals || []);
				}
			} else {
				toast.error(data.error || "Action failed");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setIsActionSubmitting(false);
		}
	};

	if (isDashboardLoading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-slate-500">
				Loading dashboard data...
			</div>
		);
	}

	if (!job) {
		return (
			<div className="max-w-xl mx-auto text-center py-12 space-y-4">
				<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
					Job post not found
				</h3>
				<p className="text-slate-500">
					The job request you are looking for does not exist or you do not have
					permission to view it.
				</p>
				<Button
					onClick={() => router.push("/dashboard")}
					className="bg-purple-600 hover:bg-purple-500 text-white"
				>
					Back to Dashboard
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<button
				type="button"
				onClick={() => router.push("/dashboard")}
				className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>Back to Dashboard</span>
			</button>

			<header className="border-b border-slate-200 dark:border-slate-800 pb-4">
				<span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-semibold">
					{job.category.name}
				</span>
				<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
					Bids for: {job.title}
				</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
					{job.description}
				</p>
				<div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400 font-semibold">
					<span>
						Budget:{" "}
						<strong className="text-purple-400">
							${Number(job.budget).toFixed(2)}
						</strong>
					</span>
					<span>
						Pricing Model:{" "}
						<strong className="capitalize">{job.pricingModel}</strong>
					</span>
					{job.deadline && (
						<span>
							Deadline:{" "}
							<strong>{new Date(job.deadline).toLocaleDateString()}</strong>
						</span>
					)}
					<span>
						Status:{" "}
						<strong className="capitalize text-yellow-400">{job.status}</strong>
					</span>
				</div>
				{job.status === "posted" && (
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<p className="text-xs text-slate-500 dark:text-slate-400">
							You can edit this post until you accept a bid.
						</p>
						<Link
							href={`/dashboard/edit-job/${id}`}
							className={cn(
								buttonVariants({ variant: "outline", size: "sm" }),
								"gap-1.5 border-purple-500/40 text-purple-600 dark:text-purple-400 font-semibold",
							)}
						>
							<Pencil className="h-3.5 w-3.5" />
							Edit job post
						</Link>
					</div>
				)}
			</header>

			{(job.status === "assigned" || job.status === "in_progress") && (
				<WorkUploadPanel
					jobId={id}
					title="Editor work updates"
				/>
			)}

			{isLoadingProposals ? (
				<div className="text-center py-8 text-slate-500">
					Loading proposals...
				</div>
			) : jobProposals.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400/70">
					<p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">
						No bids submitted yet
					</p>
					<p className="text-sm mt-1">
						Proposals will show up here as soon as providers place their bids.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{sortedProposals.map((prop) => (
						<Card
							key={prop.id}
							className={cn(
								"border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 transition-shadow",
								"shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)]",
								"dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
								prop.status === "accepted" &&
									"ring-2 ring-green-500/25 border-green-500/30",
								prop.status === "rejected" && "opacity-90",
							)}
						>
							<div className="flex justify-between items-start gap-4">
								<div>
									<h4 className="font-bold text-slate-900 dark:text-slate-100 text-md flex items-center gap-1.5">
										<Award className="h-4.5 w-4.5 text-purple-500" />
										<span>{prop.providerName}</span>
									</h4>
									<div className="flex items-center text-yellow-400 text-xs font-semibold gap-1 mt-0.5">
										<Star className="h-3.5 w-3.5 fill-current" />
										<span>{Number(prop.providerRating).toFixed(1)}</span>
									</div>
								</div>
								<div className="text-right">
									<p className="text-lg font-extrabold text-purple-400">
										${Number(prop.bidAmount).toFixed(2)}
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400/70 mt-0.5 flex items-center justify-end gap-1">
										<Calendar className="h-3.5 w-3.5" />
										<span>
											{prop.estimatedDays
												? `${prop.estimatedDays} days delivery`
												: "Negotiable timeline"}
										</span>
									</p>
								</div>
							</div>

							<div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-650 dark:text-slate-350 italic">
								&quot;{prop.proposalText}&quot;
							</div>

							{prop.status === "pending" && job.status === "posted" && (
								<p className="text-2xs text-slate-400 font-medium">
									The editor can update this bid until you accept or decline.
								</p>
							)}

							<div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 justify-between items-center gap-y-3">
								<div className="flex flex-wrap gap-1">
									{(prop.providerSkills || []).map((skill) => (
										<span
											key={skill}
											className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-2xs font-semibold"
										>
											{skill}
										</span>
									))}
								</div>

								{prop.status === "pending" && job.status === "posted" ? (
									<div className="flex flex-wrap justify-end gap-2 shrink-0">
										{prop.providerUserId && (
											<StartChatButton
												targetUserId={prop.providerUserId}
												targetName={prop.providerName}
												className="border-slate-200 dark:border-slate-700"
											/>
										)}
										<Button
											disabled={isActionSubmitting}
											onClick={() => handleProposalAction(prop.id, "reject")}
											className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-900/30 px-3.5 py-1.5 h-auto text-xs font-semibold flex items-center gap-1.5"
										>
											<Trash2 className="h-3.5 w-3.5" />
											<span>Decline</span>
										</Button>
										<Button
											disabled={isActionSubmitting}
											onClick={() => handleProposalAction(prop.id, "accept")}
											className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 h-auto text-xs font-bold flex items-center gap-1.5 shadow-sm"
										>
											<Check className="h-3.5 w-3.5" />
											<span>Accept & Assign</span>
										</Button>
									</div>
								) : (
									<div className="flex items-center gap-2 shrink-0">
										{prop.providerUserId && (
											<StartChatButton
												targetUserId={prop.providerUserId}
												targetName={prop.providerName}
												className="border-slate-200 dark:border-slate-700"
											/>
										)}
										<span
											className={cn(
												"px-3 py-1 rounded-full text-xs font-bold capitalize",
												prop.status === "accepted" &&
													"bg-green-500/10 text-green-400",
												prop.status === "rejected" &&
													"bg-red-500/10 text-red-400",
												prop.status !== "accepted" &&
													prop.status !== "rejected" &&
													"bg-slate-100 dark:bg-slate-800 text-slate-400",
											)}
										>
											Status: {prop.status}
										</span>
									</div>
								)}
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
