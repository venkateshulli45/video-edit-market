"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard-context";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SubmitBidPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();
	const {
		availableJobs,
		fetchProviderData,
		isLoading: isDashboardLoading,
	} = useDashboard();

	// Form States
	const [bidAmount, setBidAmount] = useState("");
	const [bidDays, setBidDays] = useState("");
	const [bidText, setBidText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const job = availableJobs.find((j) => j.id === id);

	const handleBidSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!job || !bidAmount || !bidText) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/proposals", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jobId: job.id,
					bidAmount: bidAmount,
					estimatedDays: bidDays ? parseInt(bidDays) : null,
					proposalText: bidText,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Proposal submitted successfully!");
				await fetchProviderData();
				router.push("/dashboard/browse-jobs");
			} else {
				toast.error(data.error || "Failed to submit bid");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setIsSubmitting(false);
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
					Job opening not found
				</h3>
				<p className="text-slate-500">
					The job listing you are attempting to bid on is no longer active or
					does not exist.
				</p>
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
				onClick={() => router.push("/dashboard/browse-jobs")}
				className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>Back to Browse Jobs</span>
			</button>

			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
				<CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
					<span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold self-start max-w-max">
						{job.category.name}
					</span>
					<CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
						Submit Bid: {job.title}
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
						{job.description}
					</CardDescription>
					<div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400 font-semibold">
						<span>
							Client&apos;s Budget:{" "}
							<strong className="text-blue-450">
								${Number(job.budget).toFixed(2)}
							</strong>
						</span>
						<span>
							Pricing:{" "}
							<strong className="capitalize">{job.pricingModel}</strong>
						</span>
					</div>
				</CardHeader>

				<CardContent className="pt-6">
					<form onSubmit={handleBidSubmit} className="space-y-6">
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
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. 200"
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
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. 5"
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
								className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
								placeholder="Explain why you are the best fit for this project, describe your workflow, and showcase relevant experiences..."
								value={bidText}
								onChange={(e) => setBidText(e.target.value)}
							/>
						</div>

						<div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
							<Button
								type="button"
								onClick={() => router.push("/dashboard/browse-jobs")}
								className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
							>
								<Send className="h-4 w-4" />
								<span>{isSubmitting ? "Submitting..." : "Submit Bid"}</span>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
