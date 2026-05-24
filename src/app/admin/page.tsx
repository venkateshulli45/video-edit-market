"use client";

import { Calendar, Check, Clock, Shield, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface UserRole {
	roleId: string;
	name: string;
	status: "pending" | "approved" | "rejected" | "expired";
	expiresAt: string | null;
}

interface UserData {
	id: string;
	email: string;
	isActive: boolean;
	expiresAt: string | null;
	createdAt: string;
	fullName: string;
	roles: UserRole[];
}

interface PendingRequest {
	userId: string;
	roleId: string;
	email: string;
	fullName: string;
	roleName: string;
	requestedAt: string;
}

interface UserSession {
	userId: string;
	email: string;
	roles: { name: string; status: string }[];
}

export default function AdminPage() {
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);
	const [session, setSession] = useState<UserSession | null>(null);
	const [users, setUsers] = useState<UserData[]>([]);
	const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
	const [activeTab, setActiveTab] = useState<"approvals" | "users">(
		"approvals",
	);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
	const [editExpiresAt, setEditExpiresAt] = useState("");
	const [editIsActive, setEditIsActive] = useState(true);
	const [editClientStatus, setEditClientStatus] = useState<string>("none");
	const [editProviderStatus, setEditProviderStatus] = useState<string>("none");
	const [editAdminStatus, setEditAdminStatus] = useState<string>("none");

	const fetchDashboardData = useCallback(async () => {
		setIsLoading(true);
		try {
			// Fetch users
			const usersRes = await fetch("/api/admin/users");
			const usersData = await usersRes.json();
			if (usersRes.ok) setUsers(usersData.users || []);

			// Fetch pending requests
			const requestsRes = await fetch("/api/admin/role-requests");
			const requestsData = await requestsRes.json();
			if (requestsRes.ok) setPendingRequests(requestsData.requests || []);
		} catch {
			toast.error("Failed to load dashboard data");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Authenticate admin session
	const verifyAdmin = useCallback(async () => {
		try {
			const res = await fetch("/api/auth/session");
			const data = await res.json();
			if (!data.user) {
				router.push("/login");
				return;
			}
			const hasAdmin = data.user.roles.some(
				(r: { name: string; status: string }) =>
					r.name === "ADMIN" && r.status === "approved",
			);
			if (!hasAdmin) {
				toast.error("Access Forbidden: Admins only");
				router.push("/dashboard");
				return;
			}
			setIsAdmin(true);
			setSession(data.user);
			fetchDashboardData();
		} catch {
			router.push("/login");
		}
	}, [router, fetchDashboardData]);

	const handleRoleAction = async (
		userId: string,
		roleId: string,
		action: "approve" | "reject",
		expiresAt?: string,
	) => {
		try {
			const response = await fetch("/api/admin/role-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, roleId, action, expiresAt }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			toast.success(data.message);
			fetchDashboardData();
		} catch (err) {
			const error = err as Error;
			toast.error(error.message || "Failed to process role request");
		}
	};

	const handleUpdateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedUser) return;

		// Build roles payload
		const rolesPayload = [];
		const originalClientRole = selectedUser.roles.find(
			(r) => r.name === "CLIENT",
		);
		const originalProviderRole = selectedUser.roles.find(
			(r) => r.name === "PROVIDER",
		);
		const originalAdminRole = selectedUser.roles.find(
			(r) => r.name === "ADMIN",
		);

		if (
			editClientStatus !==
			(originalClientRole ? originalClientRole.status : "none")
		) {
			rolesPayload.push({
				name: "CLIENT",
				status: editClientStatus === "none" ? "remove" : editClientStatus,
			});
		}
		if (
			editProviderStatus !==
			(originalProviderRole ? originalProviderRole.status : "none")
		) {
			rolesPayload.push({
				name: "PROVIDER",
				status: editProviderStatus === "none" ? "remove" : editProviderStatus,
			});
		}
		if (
			editAdminStatus !==
			(originalAdminRole ? originalAdminRole.status : "none")
		) {
			rolesPayload.push({
				name: "ADMIN",
				status: editAdminStatus === "none" ? "remove" : editAdminStatus,
			});
		}

		try {
			const response = await fetch("/api/admin/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: selectedUser.id,
					isActive: editIsActive,
					expiresAt: editExpiresAt || null,
					roles: rolesPayload,
				}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			toast.success(data.message);
			setSelectedUser(null);
			fetchDashboardData();
		} catch (err) {
			const error = err as Error;
			toast.error(error.message || "Failed to update user");
		}
	};

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		verifyAdmin();
	}, [verifyAdmin]);

	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
				Authenticating Admin...
			</div>
		);
	}

	// Stats calculation
	const totalRegistered = users.length;
	const pendingCount = pendingRequests.length;
	const activeCount = users.filter((u) => u.isActive).length;

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans w-full">
				<Toaster position="top-right" richColors />

				{session && (
					<Sidebar
						currentRole="ADMIN"
						activeAdminTab={activeTab}
						onAdminTabChange={setActiveTab}
						session={session}
						onLogout={handleLogout}
					/>
				)}

				{/* Main Admin Content Container */}
				<main className="flex-1 overflow-y-auto p-6 sm:p-10 transition-all duration-200">
					{/* Mobile sidebar trigger */}
					<div className="md:hidden mb-4">
						<SidebarTrigger className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg" />
					</div>
					{/* Header */}
					<header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
						<div>
							<div className="flex items-center space-x-2">
								<div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
									<Shield className="h-6 w-6" />
								</div>
								<h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
									Admin Control Panel
								</h1>
							</div>
							<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
								Manage user access requests, assign roles, and configure
								credentials.
							</p>
						</div>
					</header>

					{/* Statistics Cards */}
					<section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
						<Card className="border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-800/20 backdrop-blur-md">
							<CardContent className="flex items-center p-6 space-x-4">
								<div className="rounded-xl p-3 bg-blue-500/10 text-blue-400">
									<Users className="h-6 w-6" />
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
										Total Registered Users
									</p>
									<h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
										{totalRegistered}
									</h3>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-800/20 backdrop-blur-md">
							<CardContent className="flex items-center p-6 space-x-4">
								<div className="rounded-xl p-3 bg-yellow-500/10 text-yellow-400">
									<Clock className="h-6 w-6 animate-pulse" />
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
										Pending Role Requests
									</p>
									<h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
										{pendingCount}
									</h3>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-800/20 backdrop-blur-md">
							<CardContent className="flex items-center p-6 space-x-4">
								<div className="rounded-xl p-3 bg-green-500/10 text-green-400">
									<Check className="h-6 w-6" />
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
										Active Accounts
									</p>
									<h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
										{activeCount}
									</h3>
								</div>
							</CardContent>
						</Card>
					</section>

					{/* Tabs Controller */}
					<div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
						<button
							type="button"
							onClick={() => setActiveTab("approvals")}
							className={`pb-4 px-6 font-semibold transition-all border-b-2 text-sm ${
								activeTab === "approvals"
									? "border-purple-500 text-purple-400"
									: "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
							}`}
						>
							Pending Approvals ({pendingCount})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("users")}
							className={`pb-4 px-6 font-semibold transition-all border-b-2 text-sm ${
								activeTab === "users"
									? "border-purple-500 text-purple-400"
									: "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
							}`}
						>
							All Registered Users ({totalRegistered})
						</button>
					</div>

					{/* Tab Panels */}
					<section className="bg-slate-100/10 dark:bg-slate-800/10 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
						{isLoading ? (
							<div className="p-12 text-center text-slate-500 dark:text-slate-400/70">
								Loading data from postgres...
							</div>
						) : activeTab === "approvals" ? (
							/* TAB 1: PENDING APPROVALS */
							pendingRequests.length === 0 ? (
								<div className="p-12 text-center text-slate-500 dark:text-slate-400/70 flex flex-col items-center justify-center space-y-2">
									<Check className="h-8 w-8 text-green-400 mb-2" />
									<p className="font-semibold text-slate-500 dark:text-slate-400">
										All caught up!
									</p>
									<p className="text-sm">
										No pending role activation requests exist at this time.
									</p>
								</div>
							) : (
								<Table>
									<TableHeader className="bg-slate-100/30 dark:bg-slate-800/30">
										<TableRow className="border-slate-200 dark:border-slate-800">
											<TableHead className="text-slate-500 dark:text-slate-400">
												Full Name
											</TableHead>
											<TableHead className="text-slate-500 dark:text-slate-400">
												Email Address
											</TableHead>
											<TableHead className="text-slate-500 dark:text-slate-400">
												Requested Role
											</TableHead>
											<TableHead className="text-slate-500 dark:text-slate-400">
												Request Date
											</TableHead>
											<TableHead className="text-slate-500 dark:text-slate-400 text-right">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingRequests.map((req) => (
											<TableRow
												key={`${req.userId}-${req.roleId}`}
												className="border-slate-200 dark:border-slate-800 hover:bg-slate-100/20 dark:bg-slate-800/20"
											>
												<TableCell className="font-semibold text-slate-900 dark:text-slate-100">
													{req.fullName}
												</TableCell>
												<TableCell className="text-slate-500 dark:text-slate-400">
													{req.email}
												</TableCell>
												<TableCell>
													<span
														className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
															req.roleName === "CLIENT"
																? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
																: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
														}`}
													>
														{req.roleName}
													</span>
												</TableCell>
												<TableCell className="text-slate-500 dark:text-slate-400 text-sm">
													{new Date(req.requestedAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end space-x-2">
														<Button
															onClick={() =>
																handleRoleAction(
																	req.userId,
																	req.roleId,
																	"approve",
																)
															}
															className="bg-green-600 hover:bg-green-500 text-slate-900 dark:text-slate-100 font-bold px-3 py-1.5 h-auto text-xs rounded-lg flex items-center space-x-1"
														>
															<Check className="h-3 w-3" />
															<span>Approve</span>
														</Button>
														<Button
															onClick={() =>
																handleRoleAction(
																	req.userId,
																	req.roleId,
																	"reject",
																)
															}
															className="bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/20 px-3 py-1.5 h-auto text-xs rounded-lg flex items-center space-x-1"
														>
															<X className="h-3 w-3" />
															<span>Reject</span>
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)
						) : (
							/* TAB 2: USER MANAGEMENT */
							<Table>
								<TableHeader className="bg-slate-100/30 dark:bg-slate-800/30">
									<TableRow className="border-slate-200 dark:border-slate-800">
										<TableHead className="text-slate-500 dark:text-slate-400">
											Full Name
										</TableHead>
										<TableHead className="text-slate-500 dark:text-slate-400">
											Email
										</TableHead>
										<TableHead className="text-slate-500 dark:text-slate-400">
											Roles
										</TableHead>
										<TableHead className="text-slate-500 dark:text-slate-400">
											Account End Date
										</TableHead>
										<TableHead className="text-slate-500 dark:text-slate-400">
											Global Status
										</TableHead>
										<TableHead className="text-slate-500 dark:text-slate-400 text-right">
											Settings
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((user) => (
										<TableRow
											key={user.id}
											className="border-slate-200 dark:border-slate-800 hover:bg-slate-100/20 dark:bg-slate-800/20"
										>
											<TableCell className="font-semibold text-slate-900 dark:text-slate-100">
												{user.fullName}
											</TableCell>
											<TableCell className="text-slate-500 dark:text-slate-400">
												{user.email}
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1.5">
													{user.roles.map((r) => (
														<span
															key={r.name}
															className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
																r.status === "approved"
																	? "bg-green-500/10 text-green-400 border-green-500/20"
																	: r.status === "pending"
																		? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
																		: "bg-red-500/10 text-red-400 border-red-500/20"
															}`}
														>
															{r.name} ({r.status})
														</span>
													))}
												</div>
											</TableCell>
											<TableCell className="text-slate-500 dark:text-slate-400 text-sm">
												{user.expiresAt ? (
													<span className="flex items-center space-x-1 text-yellow-400">
														<Calendar className="h-3 w-3" />
														<span>
															{new Date(user.expiresAt).toLocaleDateString()}
														</span>
													</span>
												) : (
													<span className="text-slate-500 dark:text-slate-400/70 font-medium">
														Unlimited
													</span>
												)}
											</TableCell>
											<TableCell>
												<span
													className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
														user.isActive
															? "bg-green-500/10 text-green-400 border border-green-500/20"
															: "bg-red-500/10 text-red-400 border border-red-500/20"
													}`}
												>
													{user.isActive ? "Active" : "Deactivated"}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Dialog>
													<DialogTrigger
														onClick={() => {
															setSelectedUser(user);
															setEditExpiresAt(
																user.expiresAt
																	? user.expiresAt.substring(0, 10)
																	: "",
															);
															setEditIsActive(user.isActive);

															const clientRole = user.roles.find(
																(r) => r.name === "CLIENT",
															);
															const providerRole = user.roles.find(
																(r) => r.name === "PROVIDER",
															);
															const adminRole = user.roles.find(
																(r) => r.name === "ADMIN",
															);

															setEditClientStatus(
																clientRole ? clientRole.status : "none",
															);
															setEditProviderStatus(
																providerRole ? providerRole.status : "none",
															);
															setEditAdminStatus(
																adminRole ? adminRole.status : "none",
															);
														}}
														className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 px-3 py-1.5 h-auto text-xs rounded-lg inline-flex items-center justify-center font-semibold transition-colors"
													>
														Modify
													</DialogTrigger>
													<DialogContent className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-sm">
														<DialogHeader>
															<DialogTitle className="text-slate-900 dark:text-slate-100">
																Modify User Parameters
															</DialogTitle>
															<DialogDescription className="text-slate-500 dark:text-slate-400">
																Configure global account access and roles for{" "}
																{selectedUser?.fullName || selectedUser?.email}
															</DialogDescription>
														</DialogHeader>

														<form
															onSubmit={handleUpdateUser}
															className="space-y-4 my-2"
														>
															{/* Active / Deactive toggle */}
															<div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-800/30 rounded-xl p-3">
																<div>
																	<Label className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
																		Global Status
																	</Label>
																	<p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
																		Toggle users login privileges
																	</p>
																</div>
																<input
																	type="checkbox"
																	checked={editIsActive}
																	onChange={(e) =>
																		setEditIsActive(e.target.checked)
																	}
																	className="w-5 h-5 accent-purple-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
																/>
															</div>

															{/* Account End Date Input */}
															<div className="space-y-2">
																<Label
																	htmlFor="expiresAt"
																	className="text-slate-500 dark:text-slate-400 text-sm font-semibold"
																>
																	Account Expiration End Date
																</Label>
																<Input
																	id="expiresAt"
																	type="date"
																	className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-purple-500"
																	value={editExpiresAt}
																	onChange={(e) =>
																		setEditExpiresAt(e.target.value)
																	}
																/>
																<p className="text-[10px] text-slate-500 dark:text-slate-400/70">
																	Leave blank for unlimited access with no
																	expiration
																</p>
															</div>

															{/* User Roles Management Section */}
															<div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
																<Label className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
																	User Role Settings
																</Label>

																<div className="flex items-center justify-between">
																	<span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
																		Client Role
																	</span>
																	<select
																		className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-purple-500"
																		value={editClientStatus}
																		onChange={(e) =>
																			setEditClientStatus(e.target.value)
																		}
																	>
																		<option value="none">No Role</option>
																		<option value="pending">
																			Pending Approval
																		</option>
																		<option value="approved">Approved</option>
																		<option value="rejected">Rejected</option>
																	</select>
																</div>

																<div className="flex items-center justify-between mt-2">
																	<span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
																		Editor/Provider Role
																	</span>
																	<select
																		className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-purple-500"
																		value={editProviderStatus}
																		onChange={(e) =>
																			setEditProviderStatus(e.target.value)
																		}
																	>
																		<option value="none">No Role</option>
																		<option value="pending">
																			Pending Approval
																		</option>
																		<option value="approved">Approved</option>
																		<option value="rejected">Rejected</option>
																	</select>
																</div>

																<div className="flex items-center justify-between mt-2">
																	<span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
																		Admin Role
																	</span>
																	<select
																		className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-purple-500"
																		value={editAdminStatus}
																		onChange={(e) =>
																			setEditAdminStatus(e.target.value)
																		}
																	>
																		<option value="none">No Role</option>
																		<option value="pending">
																			Pending Approval
																		</option>
																		<option value="approved">Approved</option>
																		<option value="rejected">Rejected</option>
																	</select>
																</div>
															</div>

															<DialogFooter className="pt-4 gap-2">
																<Button
																	type="button"
																	onClick={() => setSelectedUser(null)}
																	className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
																>
																	Cancel
																</Button>
																<Button
																	type="submit"
																	className="bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-slate-100 font-bold"
																>
																	Save Settings
																</Button>
															</DialogFooter>
														</form>
													</DialogContent>
												</Dialog>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</section>
				</main>
			</div>
		</SidebarProvider>
	);
}
