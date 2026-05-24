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

export default function EditClientProfilePage() {
	const router = useRouter();
	const { fetchClientData } = useDashboard();

	// Form States
	const [clientFullName, setClientFullName] = useState("");
	const [clientPhoneNumber, setClientPhoneNumber] = useState("");
	const [clientAddress, setClientAddress] = useState("");
	const [isLoadingProfile, setIsLoadingProfile] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const loadClientProfile = async () => {
			try {
				const res = await fetch("/api/profile/client");
				if (res.ok) {
					const data = await res.json();
					if (data.profile) {
						setClientFullName(data.profile.fullName || "");
						setClientPhoneNumber(data.profile.phoneNumber || "");
						setClientAddress(data.profile.address || "");
					}
				} else {
					const data = await res.json();
					toast.error(data.error || "Failed to load client profile");
				}
			} catch {
				toast.error("Failed to load client profile details");
			} finally {
				setIsLoadingProfile(false);
			}
		};
		loadClientProfile();
	}, []);

	const handleUpdateClientProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!clientFullName) {
			toast.error("Full name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/profile/client", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fullName: clientFullName,
					phoneNumber: clientPhoneNumber,
					address: clientAddress,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Client profile updated successfully!");
				await fetchClientData();
				router.push("/dashboard");
			} else {
				toast.error(data.error || "Failed to update client profile");
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
				Loading client profile...
			</div>
		);
	}

	return (
		<div className="max-w-xl mx-auto py-4">
			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
				<CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
					<CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
						Edit Client Profile
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Configure details associated with your buyer account.
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6">
					<form onSubmit={handleUpdateClientProfile} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="clientName" className="text-sm font-semibold">
								Display Full Name *
							</Label>
							<Input
								id="clientName"
								required
								className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
								value={clientFullName}
								onChange={(e) => setClientFullName(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="clientPhone" className="text-sm font-semibold">
									Phone Number
								</Label>
								<Input
									id="clientPhone"
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. +1 555-0100"
									value={clientPhoneNumber}
									onChange={(e) => setClientPhoneNumber(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="clientAddress"
									className="text-sm font-semibold"
								>
									Address
								</Label>
								<Input
									id="clientAddress"
									className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100"
									placeholder="e.g. 456 Broad St, Metropolis"
									value={clientAddress}
									onChange={(e) => setClientAddress(e.target.value)}
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
								className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
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
