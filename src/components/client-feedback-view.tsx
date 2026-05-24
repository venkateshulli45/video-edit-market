"use client";

import { Loader2, MessageSquareQuote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export interface ClientReview {
	overallRating: number;
	ratingQuality: number;
	ratingCommunication: number;
	ratingTimeliness: number;
	comment: string | null;
	createdAt: string;
	clientName?: string;
}

interface ClientFeedbackViewProps {
	jobId: string;
	compact?: boolean;
}

export function ClientFeedbackView({ jobId, compact }: ClientFeedbackViewProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [review, setReview] = useState<ClientReview | null>(null);
	const [clientName, setClientName] = useState("Client");
	const [pending, setPending] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchFeedback() {
			try {
				const res = await fetch(`/api/jobs/${jobId}/review?view=provider`);
				const data = await res.json();
				if (cancelled) return;

				if (res.ok) {
					setReview(data.clientReview);
					setClientName(data.clientName || "Client");
					setPending(Boolean(data.awaitingReview));
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		void fetchFeedback();

		return () => {
			cancelled = true;
		};
	}, [jobId]);

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-sm text-slate-500 py-2">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading client feedback…
			</div>
		);
	}

	if (review) {
		return (
			<Card
				className={
					compact
						? "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2"
						: "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-3"
				}
			>
				<div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
					<MessageSquareQuote className="h-4 w-4 shrink-0" />
					<span className="text-sm font-bold">
						{clientName}&apos;s feedback
					</span>
				</div>
				<p className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
					<Star className="h-6 w-6 fill-current" />
					{review.overallRating.toFixed(1)}
					<span className="text-sm font-normal text-slate-500">/ 5</span>
				</p>
				{!compact && (
					<div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
						<p>
							Quality: <strong>{review.ratingQuality}/5</strong>
						</p>
						<p>
							Communication: <strong>{review.ratingCommunication}/5</strong>
						</p>
						<p>
							Timeliness: <strong>{review.ratingTimeliness}/5</strong>
						</p>
					</div>
				)}
				{review.comment && (
					<p className="text-sm italic text-slate-700 dark:text-slate-300">
						&ldquo;{review.comment}&rdquo;
					</p>
				)}
				<p className="text-xs text-slate-400">
					{new Date(review.createdAt).toLocaleString()}
				</p>
			</Card>
		);
	}

	if (pending) {
		return (
			<p className="text-sm text-slate-500 dark:text-slate-400 italic">
				The client hasn&apos;t left a review yet. You&apos;ll see their feedback
				here once they submit it.
			</p>
		);
	}

	return null;
}
