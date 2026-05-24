"use client";

import { Loader2, Star } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReviewData {
	id: string;
	ratingQuality: number;
	ratingCommunication: number;
	ratingTimeliness: number;
	overallRating: number;
	comment: string | null;
	createdAt: string;
}

interface EditorReviewPanelProps {
	jobId: string;
	jobStatus?: string;
}

function StarRating({
	label,
	value,
	onChange,
	disabled,
}: {
	label: string;
	value: number;
	onChange: (n: number) => void;
	disabled?: boolean;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
				{label}
			</Label>
			<div className="flex gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type="button"
						disabled={disabled}
						onClick={() => onChange(star)}
						className={cn(
							"p-0.5 rounded transition-colors",
							disabled ? "cursor-default" : "cursor-pointer hover:scale-110",
						)}
						aria-label={`${star} star${star > 1 ? "s" : ""}`}
					>
						<Star
							className={cn(
								"h-6 w-6",
								star <= value
									? "fill-yellow-400 text-yellow-400"
									: "text-slate-300 dark:text-slate-600",
							)}
						/>
					</button>
				))}
			</div>
		</div>
	);
}

export function EditorReviewPanel({ jobId, jobStatus }: EditorReviewPanelProps) {
	if (jobStatus !== "completed") {
		return null;
	}

	return <EditorReviewPanelInner jobId={jobId} />;
}

function EditorReviewPanelInner({ jobId }: { jobId: string }) {
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [canReview, setCanReview] = useState(false);
	const [providerName, setProviderName] = useState("");
	const [existingReview, setExistingReview] = useState<ReviewData | null>(null);

	const [ratingQuality, setRatingQuality] = useState(0);
	const [ratingCommunication, setRatingCommunication] = useState(0);
	const [ratingTimeliness, setRatingTimeliness] = useState(0);
	const [comment, setComment] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function fetchReview() {
			try {
				const res = await fetch(`/api/jobs/${jobId}/review`);
				const data = await res.json();
				if (cancelled) return;

				if (res.ok) {
					setCanReview(data.canReview);
					setProviderName(data.providerName || "Editor");
					setExistingReview(data.review);
				}
			} catch {
				if (!cancelled) {
					toast.error("Failed to load review");
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		void fetchReview();

		return () => {
			cancelled = true;
		};
	}, [jobId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			ratingQuality < 1 ||
			ratingCommunication < 1 ||
			ratingTimeliness < 1
		) {
			toast.error("Please rate quality, communication, and timeliness.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/jobs/${jobId}/review`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ratingQuality,
					ratingCommunication,
					ratingTimeliness,
					comment: comment.trim() || undefined,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Review submitted!");
				setExistingReview(data.review);
			} else {
				toast.error(data.error || "Could not submit review");
			}
		} catch {
			toast.error("Failed to submit review");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<Card className="border-slate-200 dark:border-slate-800 p-6 flex items-center gap-2 text-sm text-slate-500">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading review…
			</Card>
		);
	}

	if (!canReview) {
		return null;
	}

	return (
		<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
			<div>
				<h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
					<Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
					Review your editor
				</h3>
				<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
					{existingReview
						? `Your review for ${providerName} is on their profile.`
						: `Share feedback for ${providerName} after accepting their work.`}
				</p>
			</div>

			{existingReview ? (
				<div className="space-y-3 rounded-lg bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-200 dark:border-slate-800">
					<p className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
						<Star className="h-6 w-6 fill-current" />
						{existingReview.overallRating.toFixed(1)}
						<span className="text-sm font-normal text-slate-500">/ 5</span>
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
						<p>
							<span className="text-slate-500">Quality:</span>{" "}
							<span className="font-semibold">
								{existingReview.ratingQuality}/5
							</span>
						</p>
						<p>
							<span className="text-slate-500">Communication:</span>{" "}
							<span className="font-semibold">
								{existingReview.ratingCommunication}/5
							</span>
						</p>
						<p>
							<span className="text-slate-500">Timeliness:</span>{" "}
							<span className="font-semibold">
								{existingReview.ratingTimeliness}/5
							</span>
						</p>
					</div>
					{existingReview.comment && (
						<p className="text-sm italic text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
							&ldquo;{existingReview.comment}&rdquo;
						</p>
					)}
					<p className="text-xs text-slate-400">
						Submitted {new Date(existingReview.createdAt).toLocaleString()}
					</p>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<StarRating
							label="Work quality"
							value={ratingQuality}
							onChange={setRatingQuality}
							disabled={isSubmitting}
						/>
						<StarRating
							label="Communication"
							value={ratingCommunication}
							onChange={setRatingCommunication}
							disabled={isSubmitting}
						/>
						<StarRating
							label="Timeliness"
							value={ratingTimeliness}
							onChange={setRatingTimeliness}
							disabled={isSubmitting}
						/>
					</div>
					<div className="space-y-2">
						<Label
							htmlFor="review-comment"
							className="text-xs font-semibold"
						>
							Comment (optional)
						</Label>
						<textarea
							id="review-comment"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							disabled={isSubmitting}
							rows={3}
							placeholder="What went well? Anything the editor should know for future clients?"
							className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
						/>
					</div>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="bg-purple-600 hover:bg-purple-500 text-white font-bold gap-2"
					>
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Star className="h-4 w-4" />
						)}
						{isSubmitting ? "Submitting…" : "Submit review"}
					</Button>
				</form>
			)}
		</Card>
	);
}
