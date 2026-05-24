"use client";

import { Award, Calendar, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BidRequest {
	id: string;
	jobId: string;
	jobTitle: string;
	jobBudget: string | number;
	bidAmount: string | number;
	estimatedDays: number | null;
	proposalText: string;
	createdAt: string;
	providerName: string;
	providerRating: string | number;
	isUnread: boolean;
}

export default function BidRequestsPage() {
	const router = useRouter();
	const { fetchClientData } = useDashboard();
	const [requests, setRequests] = useState<BidRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [actionId, setActionId] = useState<string | null>(null);

	const loadRequests = useCallback(async () => {
		try {
			const res = await fetch("/api/proposals/bid-requests");
			const data = await res.json();
			if (res.ok) {
				setRequests(data.requests || []);
			} else {
				toast.error(data.error || "Failed to load bid requests");
			}
		} catch {
			toast.error("Failed to load bid requests");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadRequests();
	}, [loadRequests]);

	const handleAction = async (
		proposalId: string,
		action: "accept" | "reject",
	) => {
		setActionId(proposalId);
		try {
			const res = await fetch("/api/proposals", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ proposalId, action }),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || `Bid ${action}ed`);
				await fetchClientData();
				await loadRequests();
			} else {
				toast.error(data.error || "Action failed");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setActionId(null);
		}
	};

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<header>
				<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
					Bid Requests
				</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">
					Review editor bids and accept or decline. Editors can revise their
					bids until you accept one.
				</p>
			</header>

			{isLoading ? (
				<p className="text-center py-8 text-slate-500">
					Loading bid requests...
				</p>
			) : requests.length === 0 ? (
				<Card className="p-12 text-center text-slate-500 border-slate-200 dark:border-slate-800">
					<p className="font-semibold text-lg">No pending bids</p>
					<p className="text-sm mt-1">
						When editors submit bids on your posted jobs, they will appear here.
					</p>
					<Link
						href="/dashboard"
						className={cn(
							buttonVariants({ variant: "default", size: "sm" }),
							"mt-4 bg-purple-600 hover:bg-purple-500 text-white",
						)}
					>
						Back to Dashboard
					</Link>
				</Card>
			) : (
				<div className="space-y-4">
					{requests.map((req) => (
						<Card
							key={req.id}
							className={cn(
								"p-5 space-y-4 border-slate-200 dark:border-slate-800",
								req.isUnread &&
									"border-purple-400/50 bg-purple-500/5 dark:bg-purple-500/5",
							)}
						>
							<div className="flex justify-between items-start gap-4">
								<div>
									{req.isUnread && (
										<span className="text-2xs font-bold uppercase tracking-wide text-purple-400 mb-1 block">
											New
										</span>
									)}
									<h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
										<Award className="h-4 w-4 text-purple-500" />
										{req.providerName}
									</h4>
									<p className="text-sm text-slate-500 mt-0.5">
										on{" "}
										<button
											type="button"
											className="text-purple-400 hover:underline font-semibold"
											onClick={() =>
												router.push(`/dashboard/view-bids/${req.jobId}`)
											}
										>
											{req.jobTitle}
										</button>
									</p>
								</div>
								<div className="text-right shrink-0">
									<p className="text-lg font-extrabold text-purple-400">
										${Number(req.bidAmount).toFixed(2)}
									</p>
									<p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
										<Calendar className="h-3.5 w-3.5" />
										{req.estimatedDays
											? `${req.estimatedDays} days`
											: "Flexible timeline"}
									</p>
								</div>
							</div>

							<div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm italic text-slate-600 dark:text-slate-300">
								&quot;{req.proposalText}&quot;
							</div>

							<div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
								<span className="text-xs text-slate-400">
									Job budget: ${Number(req.jobBudget).toFixed(2)} · Rating:{" "}
									{Number(req.providerRating).toFixed(1)}
								</span>
								<div className="flex gap-2">
									<Button
										disabled={actionId === req.id}
										onClick={() => handleAction(req.id, "reject")}
										className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 border border-red-200 dark:border-red-900/30 h-auto py-1.5 px-3 text-xs font-semibold"
									>
										<Trash2 className="h-3.5 w-3.5 mr-1" />
										Decline
									</Button>
									<Button
										disabled={actionId === req.id}
										onClick={() => handleAction(req.id, "accept")}
										className="bg-purple-600 hover:bg-purple-500 text-white h-auto py-1.5 px-3 text-xs font-bold"
									>
										<Check className="h-3.5 w-3.5 mr-1" />
										Accept & Assign
									</Button>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
