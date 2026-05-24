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

export default function EditProfilePage() {
	const router = useRouter();
	const { fetchProviderData } = useDashboard();

	// Form States
	const [profFullName, setProfFullName] = useState("");
	const [profBio, setProfBio] = useState("");
	const [profSkills, setProfSkills] = useState("");
	const [profHourlyRate, setProfHourlyRate] = useState("");
	const [profIsAvailable, setProfIsAvailable] = useState(true);
	const [profPhoneNumber, setProfPhoneNumber] = useState("");
	const [profAddress, setProfAddress] = useState("");
	const [isLoadingProfile, setIsLoadingProfile] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const loadProviderProfile = async () => {
			try {
				const res = await fetch("/api/profile");
				if (res.ok) {
					const data = await res.json();
					if (data.profile) {
						setProfFullName(data.profile.fullName || "");
						setProfBio(data.profile.bio || "");
						setProfSkills((data.profile.skills || []).join(", "));
						setProfHourlyRate(
							data.profile.hourlyRate ? String(data.profile.hourlyRate) : "",
						);
						setProfIsAvailable(data.profile.isAvailable);
						setProfPhoneNumber(data.profile.phoneNumber || "");
						setProfAddress(data.profile.address || "");
					}
				} else {
					const data = await res.json();
					toast.error(data.error || "Failed to load expert profile");
				}
			} catch {
				toast.error("Failed to load expert profile details");
			} finally {
				setIsLoadingProfile(false);
			}
		};
		loadProviderProfile();
	}, []);

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profFullName) {
			toast.error("Full name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const skillsArray = profSkills
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s.length > 0);

			const res = await fetch("/api/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fullName: profFullName,
					bio: profBio,
					skills: skillsArray,
					hourlyRate: profHourlyRate || undefined,
					isAvailable: profIsAvailable,
					phoneNumber: profPhoneNumber,
					address: profAddress,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Profile updated successfully!");
				await fetchProviderData();
				router.push("/dashboard");
			} else {
				toast.error(data.error || "Failed to update profile");
			}
		} catch {
			toast.error("Error connecting to server");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoadingProfile) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-slate-500">
				Loading expert profile...
			</div>
		);
	}

	return (
		<div className="max-w-xl mx-auto py-4">
			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
				<CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
					<CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
						Edit Expert Profile
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Configure details shown to prospective clients on the platform.
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6">
					<form onSubmit={handleUpdateProfile} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="profName" className="text-sm font-semibold">
								Display Full Name *
							</Label>
							<Input
								id="profName"
								required
								className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
								value={profFullName}
								onChange={(e) => setProfFullName(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="profBio" className="text-sm font-semibold">
								Professional Bio
							</Label>
							<textarea
								id="profBio"
								rows={4}
								className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
								placeholder="Detail your background, software skills, and expertise..."
								value={profBio}
								onChange={(e) => setProfBio(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="profSkills" className="text-sm font-semibold">
								Expert Skills (comma separated) *
							</Label>
							<Input
								id="profSkills"
								required
								className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
								placeholder="e.g. Premiere Pro, After Effects, Color Grading, 3D Animation"
								value={profSkills}
								onChange={(e) => setProfSkills(e.target.value)}
							/>
							<p className="text-[11px] text-slate-400">
								Separate skills with commas
							</p>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="profPhone" className="text-sm font-semibold">
									Phone Number
								</Label>
								<Input
									id="profPhone"
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. +1 555-0199"
									value={profPhoneNumber}
									onChange={(e) => setProfPhoneNumber(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="profAddress" className="text-sm font-semibold">
									Address
								</Label>
								<Input
									id="profAddress"
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. 123 Main St, Springfield"
									value={profAddress}
									onChange={(e) => setProfAddress(e.target.value)}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="profRate" className="text-sm font-semibold">
									Hourly Rate ($/hr)
								</Label>
								<Input
									id="profRate"
									type="number"
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. 50"
									value={profHourlyRate}
									onChange={(e) => setProfHourlyRate(e.target.value)}
								/>
							</div>

							<div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl p-4 mt-2">
								<div>
									<Label
										className="text-slate-900 dark:text-slate-100 text-sm font-bold cursor-pointer"
										htmlFor="available"
									>
										Available for Work
									</Label>
									<p className="text-[10px] text-slate-500 dark:text-slate-400">
										Toggle public listing status
									</p>
								</div>
								<input
									id="available"
									type="checkbox"
									checked={profIsAvailable}
									onChange={(e) => setProfIsAvailable(e.target.checked)}
									className="w-4 h-4 accent-blue-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
								/>
							</div>
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
								className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
							>
								{isSubmitting ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
