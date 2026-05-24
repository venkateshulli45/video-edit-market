"use client";

import {
	Award,
	Briefcase,
	Calendar,
	Clock,
	FileText,
	MapPin,
	Plus,
	Search,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoleSession {
	name: string;
	status: string;
}

interface UserSession {
	userId: string;
	email: string;
	roles: RoleSession[];
}

interface Subcategory {
	id: string;
	name: string;
}

interface Category {
	id: string;
	name: string;
	subcategories: Subcategory[];
}

interface Job {
	id: string;
	title: string;
	description: string;
	budget: string | number;
	pricingModel: "fixed" | "hourly" | "negotiable";
	deadline: string | null;
	location: string | null;
	status: "posted" | "assigned" | "in_progress" | "completed" | "cancelled";
	createdAt: string;
	category: { name: string };
	clientName?: string;
	hasBid?: boolean;
	_count?: { proposals: number };
}

interface Proposal {
	id: string;
	bidAmount: string | number;
	estimatedDays: number | null;
	proposalText: string;
	status: "pending" | "accepted" | "rejected" | "withdrawn";
	createdAt: string;
	providerName?: string;
	providerBio?: string;
	providerSkills?: string[];
	providerRating?: string | number;
	jobTitle?: string;
	jobBudget?: string | number;
	jobStatus?: string;
	clientName?: string;
}

interface Provider {
	id: string;
	fullName: string;
	bio: string | null;
	skills: string[];
	hourlyRate: string | number | null;
	averageRating: string | number;
}

interface Contract {
	id: string;
	jobTitle: string;
	jobDescription: string;
	clientId: string;
	providerId: string;
	agreedPrice: string | number;
	status: string;
	startedAt: string;
	clientName: string;
	providerName: string;
}

export default function DashboardPage() {
	const router = useRouter();
	const [session, setSession] = useState<UserSession | null>(null);
	const [activeView, setActiveView] = useState<"CLIENT" | "PROVIDER">("CLIENT");
	const [isLoading, setIsLoading] = useState(true);

	// Categories
	const [categories, setCategories] = useState<Category[]>([]);

	// Dialog Controls
	const [isPostJobOpen, setIsPostJobOpen] = useState(false);
	const [isViewBidsOpen, setIsViewBidsOpen] = useState(false);
	const [isSearchProvidersOpen, setIsSearchProvidersOpen] = useState(false);
	const [isManageEscrowOpen, setIsManageEscrowOpen] = useState(false);
	const [isBrowseJobsOpen, setIsBrowseJobsOpen] = useState(false);
	const [isMyProposalsOpen, setIsMyProposalsOpen] = useState(false);
	const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
	const [isBidFormOpen, setIsBidFormOpen] = useState(false);
	const [isEditClientProfileOpen, setIsEditClientProfileOpen] = useState(false);

	// Client Dashboard States
	const [postedJobs, setPostedJobs] = useState<Job[]>([]);
	const [selectedJob, setSelectedJob] = useState<Job | null>(null);
	const [jobProposals, setJobProposals] = useState<Proposal[]>([]);
	const [providers, setProviders] = useState<Provider[]>([]);

	// Provider Dashboard States
	const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
	const [myProposals, setMyProposals] = useState<Proposal[]>([]);
	const [providerProfile, setProviderProfile] = useState<Provider | null>(null);

	// Shared States
	const [contracts, setContracts] = useState<Contract[]>([]);

	// Form States
	// Post Job
	const [newJobTitle, setNewJobTitle] = useState("");
	const [newJobDescription, setNewJobDescription] = useState("");
	const [newJobCategoryId, setNewJobCategoryId] = useState("");
	const [newJobPricingModel, setNewJobPricingModel] = useState<
		"fixed" | "hourly" | "negotiable"
	>("fixed");
	const [newJobBudget, setNewJobBudget] = useState("");
	const [newJobDeadline, setNewJobDeadline] = useState("");
	const [newJobLocation, setNewJobLocation] = useState("");

	// Submit Bid
	const [bidAmount, setBidAmount] = useState("");
	const [bidDays, setBidDays] = useState("");
	const [bidText, setBidText] = useState("");

	// Edit Profile
	const [profFullName, setProfFullName] = useState("");
	const [profBio, setProfBio] = useState("");
	const [profSkills, setProfSkills] = useState("");
	const [profHourlyRate, setProfHourlyRate] = useState("");
	const [profIsAvailable, setProfIsAvailable] = useState(true);
	const [profPhoneNumber, setProfPhoneNumber] = useState("");
	const [profAddress, setProfAddress] = useState("");

	// Edit Client Profile Form States
	const [clientFullName, setClientFullName] = useState("");
	const [clientPhoneNumber, setClientPhoneNumber] = useState("");
	const [clientAddress, setClientAddress] = useState("");

	// Fetch Dashboard Data (Scoped by role view)
	const fetchClientData = useCallback(async () => {
		try {
			const jobsRes = await fetch("/api/jobs?client=true");
			if (jobsRes.ok) {
				const data = await jobsRes.json();
				setPostedJobs(data.jobs || []);
			}

			const contractsRes = await fetch("/api/contracts");
			if (contractsRes.ok) {
				const data = await contractsRes.json();
				setContracts(data.contracts || []);
			}
		} catch {
			toast.error("Failed to load client data");
		}
	}, []);

	const fetchProviderData = useCallback(async () => {
		try {
			const jobsRes = await fetch("/api/jobs");
			if (jobsRes.ok) {
				const data = await jobsRes.json();
				setAvailableJobs(data.jobs || []);
			}

			const propsRes = await fetch("/api/proposals?provider=true");
			if (propsRes.ok) {
				const data = await propsRes.json();
				setMyProposals(data.proposals || []);
			}

			const profileRes = await fetch("/api/profile");
			if (profileRes.ok) {
				const data = await profileRes.json();
				setProviderProfile(data.profile);
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
			}

			const contractsRes = await fetch("/api/contracts");
			if (contractsRes.ok) {
				const data = await contractsRes.json();
				setContracts(data.contracts || []);
			}
		} catch {
			toast.error("Failed to load editor data");
		}
	}, []);

	const fetchSession = useCallback(async () => {
		try {
			const response = await fetch("/api/auth/session");
			const data = await response.json();

			if (!data.user) {
				router.push("/login");
				return;
			}

			setSession(data.user);

			// Determine default active view
			const roles = data.user.roles || [];
			const approvedRoles = roles.filter(
				(r: { name: string; status: string }) => r.status === "approved",
			);

			if (approvedRoles.length === 0) {
				router.push("/awaiting-approval");
				return;
			}

			const hasClient = approvedRoles.some(
				(r: { name: string; status: string }) => r.name === "CLIENT",
			);
			const hasProvider = approvedRoles.some(
				(r: { name: string; status: string }) => r.name === "PROVIDER",
			);

			if (hasClient) {
				setActiveView("CLIENT");
			} else if (hasProvider) {
				setActiveView("PROVIDER");
			}
		} catch {
			toast.error("Failed to load session details");
		} finally {
			setIsLoading(false);
		}
	}, [router]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchSession();
	}, [fetchSession]);

	useEffect(() => {
		if (session) {
			if (activeView === "CLIENT") {
				// eslint-disable-next-line react-hooks/set-state-in-effect
				fetchClientData();
			} else {
				fetchProviderData();
			}
		}
	}, [activeView, session, fetchClientData, fetchProviderData]);

	// Load static resources
	const loadCategories = async () => {
		try {
			const res = await fetch("/api/categories");
			if (res.ok) {
				const data = await res.json();
				setCategories(data.categories || []);
			}
		} catch {
			console.error("Failed to load categories");
		}
	};

	const loadProviders = async () => {
		try {
			const res = await fetch("/api/providers");
			if (res.ok) {
				const data = await res.json();
				setProviders(data.providers || []);
			}
		} catch {
			toast.error("Failed to load service providers");
		}
	};

	// Open Dialogs Actions
	const handleOpenPostJob = () => {
		loadCategories();
		setIsPostJobOpen(true);
	};

	const handleOpenSearchProviders = () => {
		loadProviders();
		setIsSearchProvidersOpen(true);
	};

	const handleOpenViewBids = async (job: Job) => {
		setSelectedJob(job);
		setIsViewBidsOpen(true);
		try {
			const res = await fetch(`/api/proposals?jobId=${job.id}`);
			if (res.ok) {
				const data = await res.json();
				setJobProposals(data.proposals || []);
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to load proposals");
			}
		} catch {
			toast.error("Failed to load proposals for job");
		}
	};

	// Submissions
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
				setIsPostJobOpen(false);
				// Reset form
				setNewJobTitle("");
				setNewJobDescription("");
				setNewJobCategoryId("");
				setNewJobBudget("");
				setNewJobDeadline("");
				setNewJobLocation("");
				fetchClientData();
			} else {
				toast.error(data.error || "Failed to post job");
			}
		} catch {
			toast.error("Error connecting to server");
		}
	};

	const handleBidSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedJob || !bidAmount || !bidText) {
			toast.error("Please fill in all required fields");
			return;
		}

		try {
			const res = await fetch("/api/proposals", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jobId: selectedJob.id,
					bidAmount: bidAmount,
					estimatedDays: bidDays ? parseInt(bidDays) : null,
					proposalText: bidText,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Proposal submitted successfully!");
				setIsBidFormOpen(false);
				setBidAmount("");
				setBidDays("");
				setBidText("");
				fetchProviderData();
			} else {
				toast.error(data.error || "Failed to submit bid");
			}
		} catch {
			toast.error("Error connecting to server");
		}
	};

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profFullName) {
			toast.error("Full name is required");
			return;
		}

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
				setIsEditProfileOpen(false);
				fetchProviderData();
			} else {
				toast.error(data.error || "Failed to update profile");
			}
		} catch {
			toast.error("Error connecting to server");
		}
	};

	const handleOpenEditClientProfile = async () => {
		try {
			const res = await fetch("/api/profile/client");
			if (res.ok) {
				const data = await res.json();
				if (data.profile) {
					setClientFullName(data.profile.fullName || "");
					setClientPhoneNumber(data.profile.phoneNumber || "");
					setClientAddress(data.profile.address || "");
				}
				setIsEditClientProfileOpen(true);
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to load client profile");
			}
		} catch {
			toast.error("Failed to load client profile details");
		}
	};

	const handleUpdateClientProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!clientFullName) {
			toast.error("Full name is required");
			return;
		}

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
				setIsEditClientProfileOpen(false);
				fetchClientData();
			} else {
				toast.error(data.error || "Failed to update client profile");
			}
		} catch {
			toast.error("Error connecting to server");
		}
	};

	const handleProposalAction = async (
		proposalId: string,
		action: "accept" | "reject",
	) => {
		try {
			const res = await fetch("/api/proposals", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ proposalId, action }),
			});

			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || `Bid ${action}ed successfully!`);
				setIsViewBidsOpen(false);
				fetchClientData();
			} else {
				toast.error(data.error || "Action failed");
			}
		} catch {
			toast.error("Error connecting to server");
		}
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.push("/login");
		} catch {
			toast.error("Logout failed");
		}
	};

	if (isLoading || !session) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
				Loading workspace dashboard...
			</div>
		);
	}

	// Filter client's contracts
	const clientContracts = contracts.filter(
		(c) => c.clientId === session.userId,
	);
	// Filter editor's contracts
	const providerContracts = contracts.filter(
		(c) => c.providerId === session.userId,
	);

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans w-full">
				<Toaster position="top-right" richColors />

				<Sidebar
					currentRole="USER"
					activeView={activeView}
					onViewChange={setActiveView}
					session={session}
					onLogout={handleLogout}
					onOpenPostJob={handleOpenPostJob}
					onOpenSearchProviders={handleOpenSearchProviders}
					onOpenEscrow={() => setIsManageEscrowOpen(true)}
					onOpenEditClientProfile={handleOpenEditClientProfile}
					onOpenBrowseJobs={() => setIsBrowseJobsOpen(true)}
					onOpenMyProposals={() => setIsMyProposalsOpen(true)}
					onOpenEditProfile={() => setIsEditProfileOpen(true)}
				/>

				{/* Main Workspace Dashboard Content */}
				<main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 transition-all duration-200">
					{/* Mobile sidebar trigger */}
					<div className="md:hidden mb-4">
						<SidebarTrigger className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg" />
					</div>

					{/* Dynamic Header */}
					<header className="mb-8">
						<h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
							Welcome to your Dashboard
						</h2>
						<p className="text-slate-500 dark:text-slate-400 mt-1">
							Currently acting as a{" "}
							<span
								className={`font-bold uppercase ${activeView === "CLIENT" ? "text-purple-500" : "text-blue-500"}`}
							>
								{activeView === "CLIENT"
									? "Client / Buyer"
									: "Service Provider / Editor"}
							</span>
						</p>
					</header>

					{activeView === "CLIENT" ? (
						/* CLIENT DASHBOARD INTERFACE */
						<section className="space-y-6">
							{/* Quick Actions */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								<Card
									onClick={handleOpenPostJob}
									className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
											<Plus className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
											Post a Service Request
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											Describe your project, upload requirements, and set
											budget.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									onClick={handleOpenSearchProviders}
									className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
											<Search className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
											Search Service Providers
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											Browse experts by category, skills, and portfolio reviews.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									onClick={() => setIsManageEscrowOpen(true)}
									className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-purple-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
											<Calendar className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
											Manage Escrow Milestones
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											Verify milestones, release funded payments, and view
											contracts.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									onClick={handleOpenEditClientProfile}
									className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
											<User className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
											Edit Client Profile
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											Modify your display name, contact phone, and address.
										</CardDescription>
									</CardHeader>
								</Card>
							</div>

							{/* Main Content Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
								{/* Active Jobs List */}
								<div className="lg:col-span-2 space-y-4">
									<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
										<FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
										<span>Your Posted Jobs</span>
									</h3>

									{postedJobs.length === 0 ? (
										<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-800/10 p-12 text-center text-slate-500 dark:text-slate-400/70">
											<p className="font-semibold text-slate-500 dark:text-slate-400">
												No active job posts yet
											</p>
											<p className="text-xs mt-1">
												Get started by creating your first service request
												project!
											</p>
											<Button
												onClick={handleOpenPostJob}
												className="mt-4 bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-slate-100 font-semibold text-xs"
											>
												Create Request
											</Button>
										</div>
									) : (
										<div className="space-y-4">
											{postedJobs.map((job) => (
												<Card
													key={job.id}
													className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-200 dark:border-slate-800 transition-all"
												>
													<div className="flex justify-between items-start">
														<div>
															<span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-semibold">
																{job.category.name}
															</span>
															<h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
																{job.title}
															</h4>
															<p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
																{job.description}
															</p>
														</div>
														<div className="text-right">
															<span className="text-lg font-bold text-purple-400">
																${Number(job.budget).toFixed(2)}
															</span>
															<p className="text-xs text-slate-500 dark:text-slate-400/70 capitalize">
																{job.pricingModel} model
															</p>
														</div>
													</div>

													<div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
														<div className="flex space-x-4">
															<span className="flex items-center space-x-1">
																<Clock className="h-3.5 w-3.5" />
																<span>
																	{job.deadline
																		? new Date(
																				job.deadline,
																			).toLocaleDateString()
																		: "No deadline"}
																</span>
															</span>
															{job.location && (
																<span className="flex items-center space-x-1">
																	<MapPin className="h-3.5 w-3.5" />
																	<span>{job.location}</span>
																</span>
															)}
															<span
																className={`capitalize font-semibold ${job.status === "posted" ? "text-yellow-400" : "text-green-400"}`}
															>
																Status: {job.status}
															</span>
														</div>

														<Button
															onClick={() => handleOpenViewBids(job)}
															className="bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-slate-100 font-bold px-3 py-1.5 h-auto text-xs"
														>
															View Bids ({job._count?.proposals || 0})
														</Button>
													</div>
												</Card>
											))}
										</div>
									)}
								</div>

								{/* Sidebar Info */}
								<div className="space-y-6">
									<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
										<CardHeader>
											<CardTitle className="text-md">Workspace Info</CardTitle>
											<CardDescription>
												Escrow contract status logs
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
											<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
												<span>Total Invested (Escrow):</span>
												<span className="text-slate-900 dark:text-slate-100 font-bold">
													$
													{clientContracts
														.reduce((sum, c) => sum + Number(c.agreedPrice), 0)
														.toFixed(2)}
												</span>
											</div>
											<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
												<span>Active Assignments:</span>
												<span className="text-slate-900 dark:text-slate-100">
													{
														clientContracts.filter((c) => c.status === "active")
															.length
													}
												</span>
											</div>
											<div className="flex justify-between pb-2">
												<span>Total Contracts:</span>
												<span className="text-slate-900 dark:text-slate-100">
													{clientContracts.length}
												</span>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</section>
					) : (
						/* PROVIDER DASHBOARD INTERFACE */
						<section className="space-y-6">
							{/* Quick Actions */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<Card
									onClick={() => setIsBrowseJobsOpen(true)}
									className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
											<Search className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
											Browse Available Jobs
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											Find new clients seeking editing, design, or consulting
											work.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									onClick={() => setIsMyProposalsOpen(true)}
									className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
											<FileText className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
											My Proposals
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											View and track status updates on your submitted bids and
											pitches.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									onClick={() => setIsEditProfileOpen(true)}
									className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer group"
								>
									<CardHeader>
										<div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
											<User className="h-5 w-5" />
										</div>
										<CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
											Edit Expert Profile
										</CardTitle>
										<CardDescription className="text-slate-500 dark:text-slate-400">
											Modify your bio, list expert skills, and showcase your
											portfolio.
										</CardDescription>
									</CardHeader>
								</Card>
							</div>

							{/* Main Content Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
								{/* Proposals and assignments list */}
								<div className="lg:col-span-2 space-y-4">
									<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
										<Briefcase className="h-5 w-5 text-slate-500 dark:text-slate-400" />
										<span>Active Assignments</span>
									</h3>

									{providerContracts.length === 0 ? (
										<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-800/10 p-12 text-center text-slate-500 dark:text-slate-400/70">
											<p className="font-semibold text-slate-500 dark:text-slate-400">
												No active assignments
											</p>
											<p className="text-xs mt-1">
												Start bidding on job openings to secure your first
												project assignment!
											</p>
											<Button
												onClick={() => setIsBrowseJobsOpen(true)}
												className="mt-4 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 font-semibold text-xs"
											>
												Browse Jobs
											</Button>
										</div>
									) : (
										<div className="space-y-4">
											{providerContracts.map((c) => (
												<Card
													key={c.id}
													className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-200 transition-all"
												>
													<div className="flex justify-between items-start">
														<div>
															<span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold">
																Contract Assigned
															</span>
															<h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
																{c.jobTitle}
															</h4>
															<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
																{c.jobDescription}
															</p>
															<p className="text-xs text-slate-500 dark:text-slate-400/70 mt-2">
																Client: {c.clientName}
															</p>
														</div>
														<div className="text-right">
															<span className="text-lg font-bold text-blue-400">
																${Number(c.agreedPrice).toFixed(2)}
															</span>
															<p className="text-xs text-slate-500 dark:text-slate-400/70 capitalize">
																{c.status}
															</p>
														</div>
													</div>
												</Card>
											))}
										</div>
									)}
								</div>

								{/* Sidebar Info */}
								<div className="space-y-6">
									<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
										<CardHeader>
											<CardTitle className="text-md">
												Profile Performance
											</CardTitle>
											<CardDescription>
												Reputation overview stats
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
											<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
												<span>Total Earnings:</span>
												<span className="text-slate-900 dark:text-slate-100 font-bold">
													$
													{providerContracts
														.filter((c) => c.status === "completed")
														.reduce((sum, c) => sum + Number(c.agreedPrice), 0)
														.toFixed(2)}
												</span>
											</div>
											<div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
												<span>Average Rating:</span>
												<span className="text-slate-900 dark:text-slate-100">
													{providerProfile?.averageRating
														? `${Number(providerProfile.averageRating).toFixed(2)} ★`
														: "0.00 ★"}
												</span>
											</div>
											<div className="flex justify-between pb-2">
												<span>Submitted Bids:</span>
												<span className="text-slate-900 dark:text-slate-100">
													{myProposals.length}
												</span>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</section>
					)}
				</main>

				{/* ==================================================================== */}
				{/* DIALOGS SECTION */}
				{/* ==================================================================== */}

				{/* CLIENT: POST A SERVICE REQUEST */}
				<Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Post a Service Request</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Create a job post detailing your requirements, timeline, and
								budget.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handlePostJobSubmit} className="space-y-4 my-2">
							<div className="space-y-1">
								<Label htmlFor="title">Job Title *</Label>
								<Input
									id="title"
									required
									className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
									placeholder="e.g. Professional 4K Video Editor needed for YouTube Vlog"
									value={newJobTitle}
									onChange={(e) => setNewJobTitle(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="description">
									Requirements & Description *
								</Label>
								<textarea
									id="description"
									required
									rows={4}
									className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2 w-full focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
									placeholder="List project requirements, desired style, deliverables..."
									value={newJobDescription}
									onChange={(e) => setNewJobDescription(e.target.value)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="category">Category *</Label>
									<select
										id="category"
										required
										className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
										value={newJobCategoryId}
										onChange={(e) => setNewJobCategoryId(e.target.value)}
									>
										<option value="">Select subcategory</option>
										{categories.map((cat) => (
											<optgroup
												key={cat.id}
												label={cat.name}
												className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950"
											>
												{(cat.subcategories || []).map((sub) => (
													<option
														key={sub.id}
														value={sub.id}
														className="text-slate-900 dark:text-slate-100"
													>
														{sub.name}
													</option>
												))}
											</optgroup>
										))}
									</select>
								</div>

								<div className="space-y-1">
									<Label htmlFor="pricingModel">Pricing Model *</Label>
									<select
										id="pricingModel"
										required
										className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
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

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="budget">Budget ($) *</Label>
									<Input
										id="budget"
										type="number"
										required
										min="1"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. 250"
										value={newJobBudget}
										onChange={(e) => setNewJobBudget(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<Label htmlFor="deadline">Deadline</Label>
									<Input
										id="deadline"
										type="date"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										value={newJobDeadline}
										onChange={(e) => setNewJobDeadline(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1">
								<Label htmlFor="location">
									Location (optional for local services)
								</Label>
								<Input
									id="location"
									className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
									placeholder="e.g. Remote, or New York, NY"
									value={newJobLocation}
									onChange={(e) => setNewJobLocation(e.target.value)}
								/>
							</div>

							<DialogFooter className="pt-4">
								<Button
									type="button"
									onClick={() => setIsPostJobOpen(false)}
									className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-slate-100 font-bold"
								>
									Submit Request
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				{/* CLIENT: VIEW PROPOSALS / BIDS */}
				<Dialog open={isViewBidsOpen} onOpenChange={setIsViewBidsOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Bids for: {selectedJob?.title}</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Review proposals submitted by expert editors and assign this
								contract.
							</DialogDescription>
						</DialogHeader>

						{jobProposals.length === 0 ? (
							<div className="p-8 text-center text-slate-500 dark:text-slate-400/70">
								No bids have been submitted for this service request yet.
							</div>
						) : (
							<div className="space-y-4 my-2">
								{jobProposals.map((prop) => (
									<Card
										key={prop.id}
										className="border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 p-4 space-y-3"
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-bold text-slate-900 dark:text-slate-100 text-md flex items-center space-x-1">
													<Award className="h-4 w-4 text-yellow-400" />
													<span>{prop.providerName}</span>
												</h4>
												<p className="text-[11px] text-slate-500 dark:text-slate-400/70">
													Rating: {Number(prop.providerRating).toFixed(1)} ★
												</p>
											</div>
											<div className="text-right">
												<p className="text-md font-extrabold text-purple-400">
													${Number(prop.bidAmount).toFixed(2)}
												</p>
												<p className="text-[11px] text-slate-500 dark:text-slate-400/70">
													{prop.estimatedDays
														? `Est. delivery: ${prop.estimatedDays} days`
														: "Negotiable timeline"}
												</p>
											</div>
										</div>

										<p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded border border-slate-950">
											&quot;{prop.proposalText}&quot;
										</p>

										<div className="flex flex-wrap gap-1">
											{(prop.providerSkills || []).map((skill) => (
												<span
													key={skill}
													className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]"
												>
													{skill}
												</span>
											))}
										</div>

										{prop.status === "pending" &&
										selectedJob?.status === "posted" ? (
											<div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
												<Button
													onClick={() =>
														handleProposalAction(prop.id, "reject")
													}
													className="bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/20 px-3 py-1 text-xs"
												>
													Decline
												</Button>
												<Button
													onClick={() =>
														handleProposalAction(prop.id, "accept")
													}
													className="bg-green-600 hover:bg-green-500 text-slate-900 dark:text-slate-100 font-bold px-3 py-1 text-xs"
												>
													Accept & Assign
												</Button>
											</div>
										) : (
											<div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
												<span
													className={`text-xs font-bold capitalize ${
														prop.status === "accepted"
															? "text-green-400"
															: "text-slate-500 dark:text-slate-400/70"
													}`}
												>
													Bid Status: {prop.status}
												</span>
											</div>
										)}
									</Card>
								))}
							</div>
						)}

						<DialogFooter>
							<Button
								onClick={() => setIsViewBidsOpen(false)}
								className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* CLIENT: SEARCH PROVIDERS */}
				<Dialog
					open={isSearchProvidersOpen}
					onOpenChange={setIsSearchProvidersOpen}
				>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Expert Service Providers</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Browse available freelance editors, consultants, and experts.
							</DialogDescription>
						</DialogHeader>

						{providers.length === 0 ? (
							<div className="p-8 text-center text-slate-500 dark:text-slate-400/70">
								No service providers are currently listed as available.
							</div>
						) : (
							<div className="space-y-4 my-2">
								{providers.map((p) => (
									<Card
										key={p.id}
										className="border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 p-4 space-y-2"
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-bold text-slate-900 dark:text-slate-100 text-md">
													{p.fullName}
												</h4>
												<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
													{p.bio || "No biography provided"}
												</p>
											</div>
											<div className="text-right">
												{p.hourlyRate ? (
													<p className="text-sm font-bold text-purple-400">
														${Number(p.hourlyRate).toFixed(2)}/hr
													</p>
												) : (
													<p className="text-xs text-slate-500 dark:text-slate-400/70 font-medium">
														Negotiable
													</p>
												)}
												<p className="text-[11px] text-yellow-400 mt-0.5">
													{Number(p.averageRating).toFixed(2)} ★
												</p>
											</div>
										</div>

										<div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
											{p.skills.length > 0 ? (
												p.skills.map((s) => (
													<span
														key={s}
														className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]"
													>
														{s}
													</span>
												))
											) : (
												<span className="text-[10px] text-slate-600">
													No skills listed
												</span>
											)}
										</div>
									</Card>
								))}
							</div>
						)}

						<DialogFooter>
							<Button
								onClick={() => setIsSearchProvidersOpen(false)}
								className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* CLIENT: MANAGE ESCROW / CONTRACTS */}
				<Dialog open={isManageEscrowOpen} onOpenChange={setIsManageEscrowOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Milestones & Contracts</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Review and manage your funded contracts currently held in
								escrow.
							</DialogDescription>
						</DialogHeader>

						{clientContracts.length === 0 ? (
							<div className="p-8 text-center text-slate-500 dark:text-slate-400/70">
								You do not have any active project contracts.
							</div>
						) : (
							<div className="space-y-4 my-2">
								{clientContracts.map((c) => (
									<Card
										key={c.id}
										className="border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 p-4 space-y-2"
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
													{c.jobTitle}
												</h4>
												<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
													Assigned Editor: {c.providerName}
												</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-bold text-purple-400">
													${Number(c.agreedPrice).toFixed(2)}
												</p>
												<p className="text-[10px] text-slate-500 dark:text-slate-400/70">
													Started: {new Date(c.startedAt).toLocaleDateString()}
												</p>
											</div>
										</div>
										<div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
											<span className="text-slate-500 dark:text-slate-400">
												Status:
											</span>
											<span className="text-green-400 font-bold capitalize">
												{c.status}
											</span>
										</div>
									</Card>
								))}
							</div>
						)}

						<DialogFooter>
							<Button
								onClick={() => setIsManageEscrowOpen(false)}
								className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* PROVIDER: BROWSE JOBS */}
				<Dialog open={isBrowseJobsOpen} onOpenChange={setIsBrowseJobsOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Browse Open Jobs</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Submit proposals and bids on available contract listings.
							</DialogDescription>
						</DialogHeader>

						{availableJobs.length === 0 ? (
							<div className="p-8 text-center text-slate-500 dark:text-slate-400/70">
								No open service requests are currently available.
							</div>
						) : (
							<div className="space-y-4 my-2">
								{availableJobs.map((job) => (
									<Card
										key={job.id}
										className="border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 p-4 space-y-3"
									>
										<div className="flex justify-between items-start">
											<div>
												<span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
													{job.category.name}
												</span>
												<h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">
													{job.title}
												</h4>
												<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
													{job.description}
												</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-bold text-blue-400">
													${Number(job.budget).toFixed(2)}
												</p>
												<p className="text-[10px] text-slate-500 dark:text-slate-400/70 capitalize">
													{job.pricingModel}
												</p>
											</div>
										</div>

										<div className="pt-2 border-t border-slate-950 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400/70">
											<span>
												Deadline:{" "}
												{job.deadline
													? new Date(job.deadline).toLocaleDateString()
													: "No deadline"}
											</span>

											{job.hasBid ? (
												<span className="text-slate-600 font-bold">
													Proposal Submitted
												</span>
											) : (
												<Button
													onClick={() => {
														setSelectedJob(job);
														setIsBidFormOpen(true);
													}}
													className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 font-bold px-3 py-1 h-auto text-xs"
												>
													Submit Bid
												</Button>
											)}
										</div>
									</Card>
								))}
							</div>
						)}

						<DialogFooter>
							<Button
								onClick={() => setIsBrowseJobsOpen(false)}
								className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* PROVIDER: SUBMIT BID FORM */}
				<Dialog open={isBidFormOpen} onOpenChange={setIsBidFormOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-md">
						<DialogHeader>
							<DialogTitle>Submit Bid for: {selectedJob?.title}</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Provide your delivery terms and pitch details to the client.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleBidSubmit} className="space-y-4 my-2">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="bidAmount">Bid Amount ($) *</Label>
									<Input
										id="bidAmount"
										type="number"
										required
										min="1"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. 200"
										value={bidAmount}
										onChange={(e) => setBidAmount(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<Label htmlFor="bidDays">Estimated Days</Label>
									<Input
										id="bidDays"
										type="number"
										min="1"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. 5"
										value={bidDays}
										onChange={(e) => setBidDays(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1">
								<Label htmlFor="bidText">Pitch / Proposal Description *</Label>
								<textarea
									id="bidText"
									required
									rows={4}
									className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
									placeholder="Explain why you are the best fit for this project..."
									value={bidText}
									onChange={(e) => setBidText(e.target.value)}
								/>
							</div>

							<DialogFooter>
								<Button
									type="button"
									onClick={() => setIsBidFormOpen(false)}
									className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 font-bold"
								>
									Submit Bid
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				{/* PROVIDER: MY PROPOSALS */}
				<Dialog open={isMyProposalsOpen} onOpenChange={setIsMyProposalsOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>My Proposals</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Track the status of all bids you have submitted.
							</DialogDescription>
						</DialogHeader>

						{myProposals.length === 0 ? (
							<div className="p-8 text-center text-slate-500 dark:text-slate-400/70">
								You have not submitted any bids yet.
							</div>
						) : (
							<div className="space-y-4 my-2">
								{myProposals.map((prop) => (
									<Card
										key={prop.id}
										className="border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 p-4 space-y-2"
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
													{prop.jobTitle}
												</h4>
												<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
													Client: {prop.clientName}
												</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-bold text-blue-400">
													${Number(prop.bidAmount).toFixed(2)}
												</p>
												<p className="text-[10px] text-slate-500 dark:text-slate-400/70">
													{prop.estimatedDays
														? `${prop.estimatedDays} days delivery`
														: "Negotiated time"}
												</p>
											</div>
										</div>
										<div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
											<span className="text-slate-500 dark:text-slate-400/70">
												Your pitch: &quot;{prop.proposalText}&quot;
											</span>
											<span
												className={`font-semibold capitalize ${
													prop.status === "accepted"
														? "text-green-400"
														: prop.status === "rejected"
															? "text-red-400"
															: "text-yellow-400"
												}`}
											>
												{prop.status}
											</span>
										</div>
									</Card>
								))}
							</div>
						)}

						<DialogFooter>
							<Button
								onClick={() => setIsMyProposalsOpen(false)}
								className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* PROVIDER: EDIT PROFILE */}
				<Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-lg">
						<DialogHeader>
							<DialogTitle>Edit Expert Profile</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Configure details shown to prospective clients on the platform.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleUpdateProfile} className="space-y-4 my-2">
							<div className="space-y-1">
								<Label htmlFor="profName">Display Full Name *</Label>
								<Input
									id="profName"
									required
									className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
									value={profFullName}
									onChange={(e) => setProfFullName(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="profBio">Professional Bio</Label>
								<textarea
									id="profBio"
									rows={3}
									className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
									placeholder="Detail your background, software skills, and expertise..."
									value={profBio}
									onChange={(e) => setProfBio(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="profSkills">
									Expert Skills (comma separated) *
								</Label>
								<Input
									id="profSkills"
									required
									className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
									placeholder="e.g. Premiere Pro, After Effects, Color Grading, 3D Animation"
									value={profSkills}
									onChange={(e) => setProfSkills(e.target.value)}
								/>
								<p className="text-[10px] text-slate-500 dark:text-slate-400/70">
									Separate skills with commas
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="profPhone">Phone Number</Label>
									<Input
										id="profPhone"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. +1 555-0199"
										value={profPhoneNumber}
										onChange={(e) => setProfPhoneNumber(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="profAddress">Address</Label>
									<Input
										id="profAddress"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. 123 Main St, Springfield"
										value={profAddress}
										onChange={(e) => setProfAddress(e.target.value)}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="profRate">Hourly Rate ($/hr)</Label>
									<Input
										id="profRate"
										type="number"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. 50"
										value={profHourlyRate}
										onChange={(e) => setProfHourlyRate(e.target.value)}
									/>
								</div>

								<div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 rounded-xl p-3">
									<div>
										<Label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
											Available for Work
										</Label>
										<p className="text-[9px] text-slate-500 dark:text-slate-400/70">
											Toggle public listing status
										</p>
									</div>
									<input
										type="checkbox"
										checked={profIsAvailable}
										onChange={(e) => setProfIsAvailable(e.target.checked)}
										className="w-4 h-4 accent-blue-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
									/>
								</div>
							</div>

							<DialogFooter className="pt-4">
								<Button
									type="button"
									onClick={() => setIsEditProfileOpen(false)}
									className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 font-bold"
								>
									Save Changes
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				{/* CLIENT: EDIT PROFILE */}
				<Dialog
					open={isEditClientProfileOpen}
					onOpenChange={setIsEditClientProfileOpen}
				>
					<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-lg">
						<DialogHeader>
							<DialogTitle>Edit Client Profile</DialogTitle>
							<DialogDescription className="text-slate-500 dark:text-slate-400">
								Configure details associated with your buyer account.
							</DialogDescription>
						</DialogHeader>

						<form
							onSubmit={handleUpdateClientProfile}
							className="space-y-4 my-2"
						>
							<div className="space-y-1">
								<Label htmlFor="clientName">Display Full Name *</Label>
								<Input
									id="clientName"
									required
									className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
									value={clientFullName}
									onChange={(e) => setClientFullName(e.target.value)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="clientPhone">Phone Number</Label>
									<Input
										id="clientPhone"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. +1 555-0100"
										value={clientPhoneNumber}
										onChange={(e) => setClientPhoneNumber(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="clientAddress">Address</Label>
									<Input
										id="clientAddress"
										className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
										placeholder="e.g. 456 Broad St, Metropolis"
										value={clientAddress}
										onChange={(e) => setClientAddress(e.target.value)}
									/>
								</div>
							</div>

							<DialogFooter className="pt-4">
								<Button
									type="button"
									onClick={() => setIsEditClientProfileOpen(false)}
									className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-slate-100 font-bold"
								>
									Save Changes
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
		</SidebarProvider>
	);
}
