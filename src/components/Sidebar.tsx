"use client";

import {
	Briefcase,
	Calendar,
	ChevronLeft,
	ChevronRight,
	FileText,
	Laptop,
	LogOut,
	Moon,
	PlusCircle,
	Search,
	ShieldAlert,
	Sun,
	User,
	UserCheck,
	Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RoleSession {
	name: string;
	status: string;
}

interface UserSession {
	userId: string;
	email: string;
	roles: RoleSession[];
}

interface SidebarProps {
	currentRole: "ADMIN" | "USER"; // ADMIN, or USER which toggle views
	activeView?: "CLIENT" | "PROVIDER";
	onViewChange?: (view: "CLIENT" | "PROVIDER") => void;
	session: UserSession;
	onLogout: () => void;

	// Dashboard Action Triggers
	onOpenPostJob?: () => void;
	onOpenSearchProviders?: () => void;
	onOpenEscrow?: () => void;
	onOpenEditClientProfile?: () => void;
	onOpenBrowseJobs?: () => void;
	onOpenMyProposals?: () => void;
	onOpenEditProfile?: () => void;

	// Admin Navigation Actions
	activeAdminTab?: "approvals" | "users";
	onAdminTabChange?: (tab: "approvals" | "users") => void;
}

export default function Sidebar({
	currentRole,
	activeView,
	onViewChange,
	session,
	onLogout,
	onOpenPostJob,
	onOpenSearchProviders,
	onOpenEscrow,
	onOpenEditClientProfile,
	onOpenBrowseJobs,
	onOpenMyProposals,
	onOpenEditProfile,
	activeAdminTab,
	onAdminTabChange,
}: SidebarProps) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	// Handle hydration mismatch
	useEffect(() => {
		const t = setTimeout(() => {
			setMounted(true);
		}, 0);
		return () => clearTimeout(t);
	}, []);

	const approvedRoles = (session?.roles || [])
		.filter((r) => r.status === "approved")
		.map((r) => r.name);

	const hasClient = approvedRoles.includes("CLIENT");
	const hasProvider = approvedRoles.includes("PROVIDER");

	const actualRole = currentRole;

	// Cycle theme in collapsed view
	const cycleTheme = () => {
		if (theme === "light") setTheme("dark");
		else if (theme === "dark") setTheme("system");
		else setTheme("light");
	};

	const getThemeIcon = () => {
		if (theme === "light") return <Sun className="h-4 w-4" />;
		if (theme === "dark") return <Moon className="h-4 w-4" />;
		return <Laptop className="h-4 w-4" />;
	};

	const getThemeLabel = () => {
		if (theme === "light") return "Light Theme";
		if (theme === "dark") return "Dark Theme";
		return "System Theme";
	};

	return (
		<aside
			className={cn(
				"h-screen sticky top-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 ease-in-out select-none",
				isCollapsed ? "w-16" : "w-64",
			)}
		>
			{/* Header section (Logo and Title) */}
			<div
				className={cn(
					"p-4 flex items-center border-b border-slate-200 dark:border-slate-800 h-16",
					isCollapsed ? "justify-center" : "justify-between",
				)}
			>
				<div className="flex items-center space-x-3 overflow-hidden">
					<div className="h-8 w-8 rounded-lg bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 p-1 flex items-center justify-center font-extrabold text-white text-sm shrink-0">
						M
					</div>
					{!isCollapsed && (
						<span className="font-extrabold text-base tracking-tight bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent truncate">
							Marketplace Hub
						</span>
					)}
				</div>
				{!isCollapsed && (
					<button
						onClick={() => setIsCollapsed(true)}
						className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400 transition-colors"
						title="Collapse Sidebar"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
				)}
				{isCollapsed && (
					<button
						onClick={() => setIsCollapsed(false)}
						className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-md transition-colors"
						title="Expand Sidebar"
					>
						<ChevronRight className="h-3 w-3" />
					</button>
				)}
			</div>

			{/* Role Toggle Switch (If user has multiple roles) */}
			{actualRole !== "ADMIN" && hasClient && hasProvider && !isCollapsed && (
				<div className="px-4 pt-4">
					<div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-1">
						<button
							onClick={() => onViewChange?.("CLIENT")}
							className={cn(
								"flex-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-1",
								activeView === "CLIENT"
									? "bg-purple-600 text-white shadow-sm"
									: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100",
							)}
						>
							<UserCheck className="h-3 w-3" />
							<span>Client</span>
						</button>
						<button
							onClick={() => onViewChange?.("PROVIDER")}
							className={cn(
								"flex-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-1",
								activeView === "PROVIDER"
									? "bg-blue-600 text-white shadow-sm"
									: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100",
							)}
						>
							<Briefcase className="h-3 w-3" />
							<span>Editor</span>
						</button>
					</div>
				</div>
			)}

			{/* Collapsed Role view toggle trigger */}
			{actualRole !== "ADMIN" && hasClient && hasProvider && isCollapsed && (
				<div className="px-3 pt-4 flex justify-center relative group">
					<button
						onClick={() =>
							onViewChange?.(activeView === "CLIENT" ? "PROVIDER" : "CLIENT")
						}
						className={cn(
							"p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center",
							activeView === "CLIENT"
								? "bg-purple-500/10 text-purple-400 border-purple-500/20"
								: "bg-blue-500/10 text-blue-400 border-blue-500/20",
						)}
					>
						{activeView === "CLIENT" ? (
							<UserCheck className="h-4 w-4" />
						) : (
							<Briefcase className="h-4 w-4" />
						)}
					</button>
					<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
						Switch to {activeView === "CLIENT" ? "Editor View" : "Client View"}
					</span>
				</div>
			)}

			{/* Navigation options */}
			<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				{actualRole === "ADMIN" ? (
					/* ADMIN NAVIGATION LINKS */
					<>
						<div className="relative group">
							<button
								onClick={() => onAdminTabChange?.("approvals")}
								className={cn(
									"w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
									activeAdminTab === "approvals"
										? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/15"
										: "text-slate-500 dark:text-slate-400",
								)}
							>
								<ShieldAlert className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Pending Approvals</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Pending Approvals
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={() => onAdminTabChange?.("users")}
								className={cn(
									"w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
									activeAdminTab === "users"
										? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/15"
										: "text-slate-500 dark:text-slate-400",
								)}
							>
								<Users className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">All Registered Users</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									All Registered Users
								</span>
							)}
						</div>
					</>
				) : activeView === "CLIENT" ? (
					/* CLIENT NAVIGATION LINKS */
					<>
						<div className="relative group">
							<button
								onClick={() => {
									const elem = document.getElementById("client-posted-jobs");
									if (elem) elem.scrollIntoView({ behavior: "smooth" });
								}}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<FileText className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Your Posted Jobs</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Your Posted Jobs
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={onOpenPostJob}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<PlusCircle className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Post service request</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Post Service Request
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={onOpenSearchProviders}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<Search className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Search Providers</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Search Providers
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={onOpenEscrow}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<Calendar className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Manage Escrow</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Manage Escrow
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={onOpenEditClientProfile}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<User className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Edit Client Profile</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Edit Client Profile
								</span>
							)}
						</div>
					</>
				) : (
					/* PROVIDER NAVIGATION LINKS */
					<>
						<div className="relative group">
							<button
								onClick={onOpenBrowseJobs}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<Search className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && <span className="truncate">Browse Jobs</span>}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Browse Jobs
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={onOpenMyProposals}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<FileText className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && <span className="truncate">My Proposals</span>}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									My Proposals
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={() => {
									const elem = document.getElementById("provider-contracts");
									if (elem) elem.scrollIntoView({ behavior: "smooth" });
								}}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<Briefcase className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Active Contracts</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Active Contracts
								</span>
							)}
						</div>

						<div className="relative group">
							<button
								onClick={onOpenEditProfile}
								className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400"
							>
								<User className="h-4.5 w-4.5 shrink-0" />
								{!isCollapsed && (
									<span className="truncate">Professional Profile</span>
								)}
							</button>
							{isCollapsed && (
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									Professional Profile
								</span>
							)}
						</div>
					</>
				)}
			</nav>

			{/* Footer (Theme Toggle, Session User Info, Logout) */}
			<div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
				{/* Sun/Moon/Laptop Theme Selector */}
				{mounted && (
					<>
						{!isCollapsed ? (
							<div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-1">
								<button
									onClick={() => setTheme("light")}
									className={cn(
										"flex-1 p-1.5 rounded-md flex justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all",
										theme === "light" &&
											"bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm",
									)}
									title="Light mode"
								>
									<Sun className="h-3.5 w-3.5" />
								</button>
								<button
									onClick={() => setTheme("dark")}
									className={cn(
										"flex-1 p-1.5 rounded-md flex justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all",
										theme === "dark" &&
											"bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm",
									)}
									title="Dark mode"
								>
									<Moon className="h-3.5 w-3.5" />
								</button>
								<button
									onClick={() => setTheme("system")}
									className={cn(
										"flex-1 p-1.5 rounded-md flex justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all",
										theme === "system" &&
											"bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm",
									)}
									title="System default"
								>
									<Laptop className="h-3.5 w-3.5" />
								</button>
							</div>
						) : (
							<div className="flex justify-center relative group">
								<button
									onClick={cycleTheme}
									className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all flex items-center justify-center"
								>
									{getThemeIcon()}
								</button>
								<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
									{getThemeLabel()}
								</span>
							</div>
						)}
					</>
				)}

				{/* User Info Block */}
				<div
					className={cn(
						"flex items-center justify-between",
						isCollapsed ? "justify-center" : "px-2 py-1.5",
					)}
				>
					{!isCollapsed ? (
						<div className="flex items-center space-x-2.5 overflow-hidden">
							<div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-slate-100 shrink-0 uppercase text-xs">
								{session?.email ? session.email[0] : "U"}
							</div>
							<div className="flex flex-col text-left overflow-hidden">
								<span className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
									{session?.email}
								</span>
								<span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
									{actualRole === "ADMIN" ? "Admin" : activeView}
								</span>
							</div>
						</div>
					) : (
						<div className="relative group">
							<div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-slate-100 uppercase text-xs">
								{session?.email ? session.email[0] : "U"}
							</div>
							<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50 flex flex-col">
								<span className="font-bold">{session?.email}</span>
								<span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">
									{actualRole === "ADMIN" ? "Admin" : activeView?.toLowerCase()}{" "}
									Mode
								</span>
							</span>
						</div>
					)}

					{!isCollapsed && (
						<button
							onClick={onLogout}
							className="text-slate-500 dark:text-slate-400 hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-800"
							title="Sign Out"
						>
							<LogOut className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Collapsed logout button */}
				{isCollapsed && (
					<div className="flex justify-center relative group">
						<button
							onClick={onLogout}
							className="p-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-destructive hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center"
						>
							<LogOut className="h-4 w-4" />
						</button>
						<span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded px-2.5 py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-md border whitespace-nowrap z-50">
							Sign Out
						</span>
					</div>
				)}
			</div>
		</aside>
	);
}
