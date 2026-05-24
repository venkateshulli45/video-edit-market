"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { WorkUploadPanel } from "@/components/work-upload-panel";
import { Button } from "@/components/ui/button";

export default function DeliverWorkPage({
	params,
}: {
	params: Promise<{ jobId: string }>;
}) {
	const { jobId } = use(params);
	const router = useRouter();
	const { contracts, fetchProviderData, isLoading } = useDashboard();
	const [hasAccess, setHasAccess] = useState<boolean | null>(null);

	const contract = contracts.find(
		(c) => c.jobId === jobId && c.status !== "completed" && c.status !== "refunded",
	);

	useEffect(() => {
		fetchProviderData();
	}, [fetchProviderData]);

	useEffect(() => {
		if (!isLoading) {
			setHasAccess(Boolean(contract));
		}
	}, [isLoading, contract]);

	if (isLoading || hasAccess === null) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-slate-500">
				Loading assignment…
			</div>
		);
	}

	if (!contract) {
		return (
			<div className="max-w-xl mx-auto text-center py-12 space-y-4">
				<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
					Assignment not found
				</h3>
				<p className="text-slate-500">
					This job is not assigned to you, or your bid has not been accepted yet.
				</p>
				<Button
					onClick={() => router.push("/dashboard/my-proposals")}
					className="bg-blue-600 hover:bg-blue-500 text-white"
				>
					My Proposals
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<Link
				href="/dashboard"
				className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>Back to Dashboard</span>
			</Link>

			<header className="border-b border-slate-200 dark:border-slate-800 pb-4">
				<span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs font-semibold">
					Accepted assignment
				</span>
				<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
					{contract.jobTitle}
				</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">
					Client: {contract.clientName} · Agreed ${Number(contract.agreedPrice).toFixed(2)}
				</p>
			</header>

			<WorkUploadPanel
				jobId={jobId}
				canUpload
				title="Upload work for client review"
			/>
		</div>
	);
}
