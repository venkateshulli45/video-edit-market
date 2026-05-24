"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
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

export default function EditJobPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: jobId } = use(params);
	const router = useRouter();
	const { categories, loadCategories, fetchClientData } = useDashboard();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [pricingModel, setPricingModel] = useState<
		"fixed" | "hourly" | "negotiable"
	>("fixed");
	const [budget, setBudget] = useState("");
	const [deadline, setDeadline] = useState("");
	const [location, setLocation] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		loadCategories();
	}, [loadCategories]);

	useEffect(() => {
		const loadJob = async () => {
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				const data = await res.json();
				if (!res.ok) {
					toast.error(data.error || "Failed to load job");
					router.push("/dashboard");
					return;
				}
				const job = data.job;
				if (job.status !== "posted") {
					toast.error("This job can no longer be edited");
					router.push("/dashboard");
					return;
				}
				setTitle(job.title);
				setDescription(job.description);
				setCategoryId(job.categoryId);
				setPricingModel(job.pricingModel);
				setBudget(String(job.budget));
				setDeadline(
					job.deadline
						? new Date(job.deadline).toISOString().slice(0, 10)
						: "",
				);
				setLocation(job.location || "");
			} catch {
				toast.error("Failed to load job");
				router.push("/dashboard");
			} finally {
				setIsLoading(false);
			}
		};

		if (jobId) {
			loadJob();
		}
	}, [jobId, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title || !description || !categoryId || !budget) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/jobs/${jobId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					description,
					categoryId,
					pricingModel,
					budget,
					deadline: deadline || undefined,
					location: location || undefined,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Job updated");
				await fetchClientData();
				router.push(`/dashboard/view-bids/${jobId}`);
			} else {
				toast.error(data.error || "Failed to update job");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-slate-500">
				Loading job…
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto py-4 space-y-4">
			<Link
				href="/dashboard"
				className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>Back to Dashboard</span>
			</Link>

			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
				<CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
					<CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
						Edit Job Post
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Update your request while it is still open. Editing is disabled after
						you accept a bid.
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="title" className="text-sm font-semibold">
								Job Title *
							</Label>
							<Input
								id="title"
								required
								className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description" className="text-sm font-semibold">
								Requirements & Description *
							</Label>
							<textarea
								id="description"
								required
								rows={5}
								className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="category" className="text-sm font-semibold">
									Category *
								</Label>
								<select
									id="category"
									required
									className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
									value={categoryId}
									onChange={(e) => setCategoryId(e.target.value)}
								>
									<option value="">Select subcategory</option>
									{categories.map((cat) => (
										<optgroup key={cat.id} label={cat.name}>
											{(cat.subcategories || []).map((sub) => (
												<option key={sub.id} value={sub.id}>
													{sub.name}
												</option>
											))}
										</optgroup>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="pricingModel" className="text-sm font-semibold">
									Pricing Model *
								</Label>
								<select
									id="pricingModel"
									required
									className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
									value={pricingModel}
									onChange={(e) =>
										setPricingModel(
											e.target.value as "fixed" | "hourly" | "negotiable",
										)
									}
								>
									<option value="fixed">Fixed Price</option>
									<option value="hourly">Hourly Rate</option>
									<option value="negotiable">Negotiable</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="budget" className="text-sm font-semibold">
									Budget ($) *
								</Label>
								<Input
									id="budget"
									type="number"
									required
									min="1"
									className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
									value={budget}
									onChange={(e) => setBudget(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="deadline" className="text-sm font-semibold">
									Deadline
								</Label>
								<Input
									id="deadline"
									type="date"
									className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
									value={deadline}
									onChange={(e) => setDeadline(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="location" className="text-sm font-semibold">
								Location (optional)
							</Label>
							<Input
								id="location"
								className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
							/>
						</div>

						<div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
							<Button
								type="button"
								onClick={() => router.push(`/dashboard/view-bids/${jobId}`)}
								className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-purple-600 hover:bg-purple-500 text-white font-bold gap-2"
							>
								<Save className="h-4 w-4" />
								{isSubmitting ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
