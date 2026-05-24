"use client";

import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard-context";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditBidPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: jobId } = use(params);
	const router = useRouter();
	const {
		availableJobs,
		fetchProviderData,
		isLoading: isDashboardLoading,
	} = useDashboard();

	const [proposalId, setProposalId] = useState<string | null>(null);
	const [bidAmount, setBidAmount] = useState("");
	const [bidDays, setBidDays] = useState("");
	const [bidText, setBidText] = useState("");
	const [isLoadingProposal, setIsLoadingProposal] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const job = availableJobs.find((j) => j.id === jobId);
	useEffect(() => {
		const loadProposal = async () => {
			try {
				const res = await fetch(`/api/proposals?mineForJob=${jobId}`);
				if (res.ok) {
					const data = await res.json();
					const prop = data.proposal;
					if (prop.status !== "pending") {
						toast.error("This bid can no longer be edited");
						router.push("/dashboard/my-proposals");
						return;
					}
					setProposalId(prop.id);
					setBidAmount(String(prop.bidAmount));
					setBidDays(prop.estimatedDays ? String(prop.estimatedDays) : "");
					setBidText(prop.proposalText);
				} else {
					toast.error("Pending bid not found");
					router.push("/dashboard/my-proposals");
				}
			} catch {
				toast.error("Failed to load your bid");
			} finally {
				setIsLoadingProposal(false);
			}
		};

		if (jobId) {
			loadProposal();
		}
	}, [jobId, router]);

	const handleBidUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!proposalId || !bidAmount || !bidText) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/proposals", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					proposalId,
					bidAmount,
					estimatedDays: bidDays ? parseInt(bidDays) : null,
					proposalText: bidText,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Bid updated successfully!");
				await fetchProviderData();
				router.push("/dashboard/my-proposals");
			} else {
				toast.error(data.error || "Failed to update bid");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isDashboardLoading || isLoadingProposal) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-slate-500">
				Loading bid...
			</div>
		);
	}

	if (!job) {
		return (
			<div className="max-w-xl mx-auto text-center py-12 space-y-4">
				<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
					Job opening not found
				</h3>
				<Button
					onClick={() => router.push("/dashboard/browse-jobs")}
					className="bg-blue-600 hover:bg-blue-500 text-white"
				>
					Back to Browse Jobs
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl mx-auto py-4">
			<button
				type="button"
				onClick={() => router.push("/dashboard/my-proposals")}
				className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>Back to My Proposals</span>
			</button>

			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
				<CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
					<span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-xs font-semibold self-start max-w-max">
						Awaiting client review
					</span>
					<CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
						Edit Bid: {job.title}
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
						You can update your bid until the client accepts or declines it.
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6">
					<form onSubmit={handleBidUpdate} className="space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="bidAmount" className="text-sm font-semibold">
									Your Bid Amount ($) *
								</Label>
								<Input
									id="bidAmount"
									type="number"
									required
									min="1"
									value={bidAmount}
									onChange={(e) => setBidAmount(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bidDays" className="text-sm font-semibold">
									Estimated Days to Deliver
								</Label>
								<Input
									id="bidDays"
									type="number"
									min="1"
									value={bidDays}
									onChange={(e) => setBidDays(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bidText" className="text-sm font-semibold">
								Pitch / Proposal Description *
							</Label>
							<textarea
								id="bidText"
								required
								rows={5}
								className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								value={bidText}
								onChange={(e) => setBidText(e.target.value)}
							/>
						</div>

						<div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.push("/dashboard/my-proposals")}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
							>
								<Save className="h-4 w-4" />
								<span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
