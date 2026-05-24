"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function PostJobPage() {
	const router = useRouter();
	const { categories, loadCategories, fetchClientData } = useDashboard();

	// Form States
	const [newJobTitle, setNewJobTitle] = useState("");
	const [newJobDescription, setNewJobDescription] = useState("");
	const [newJobCategoryId, setNewJobCategoryId] = useState("");
	const [newJobPricingModel, setNewJobPricingModel] = useState<
		"fixed" | "hourly" | "negotiable"
	>("fixed");
	const [newJobBudget, setNewJobBudget] = useState("");
	const [newJobDeadline, setNewJobDeadline] = useState("");
	const [newJobLocation, setNewJobLocation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		loadCategories();
	}, [loadCategories]);

	const handlePostJobSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!newJobTitle ||
			!newJobDescription ||
			!newJobCategoryId ||
			!newJobBudget
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/jobs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: newJobTitle,
					description: newJobDescription,
					categoryId: newJobCategoryId,
					pricingModel: newJobPricingModel,
					budget: newJobBudget,
					deadline: newJobDeadline || undefined,
					location: newJobLocation || undefined,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Job posted successfully!");
				await fetchClientData();
				router.push("/dashboard");
			} else {
				toast.error(data.error || "Failed to post job");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto py-4">
			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
				<CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
					<CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
						Post a Service Request
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Create a job post detailing your requirements, timeline, and budget.
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6">
					<form onSubmit={handlePostJobSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="title" className="text-sm font-semibold">
								Job Title *
							</Label>
							<Input
								id="title"
								required
								className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
								placeholder="e.g. Professional 4K Video Editor needed for YouTube Vlog"
								value={newJobTitle}
								onChange={(e) => setNewJobTitle(e.target.value)}
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
								placeholder="List project requirements, desired style, deliverables..."
								value={newJobDescription}
								onChange={(e) => setNewJobDescription(e.target.value)}
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
									className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={newJobCategoryId}
									onChange={(e) => setNewJobCategoryId(e.target.value)}
								>
									<option value="">Select subcategory</option>
									{categories.map((cat) => (
										<optgroup
											key={cat.id}
											label={cat.name}
											className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 font-bold"
										>
											{(cat.subcategories || []).map((sub) => (
												<option
													key={sub.id}
													value={sub.id}
													className="text-slate-900 dark:text-slate-100 font-normal"
												>
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
									className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={newJobPricingModel}
									onChange={(e) =>
										setNewJobPricingModel(
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
									placeholder="e.g. 250"
									value={newJobBudget}
									onChange={(e) => setNewJobBudget(e.target.value)}
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
									value={newJobDeadline}
									onChange={(e) => setNewJobDeadline(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="location" className="text-sm font-semibold">
								Location (optional for local services)
							</Label>
							<Input
								id="location"
								className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
								placeholder="e.g. Remote, or New York, NY"
								value={newJobLocation}
								onChange={(e) => setNewJobLocation(e.target.value)}
							/>
						</div>

						<div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
							<Button
								type="button"
								onClick={() => router.push("/dashboard")}
								className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
							>
								{isSubmitting ? "Posting..." : "Submit Request"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
