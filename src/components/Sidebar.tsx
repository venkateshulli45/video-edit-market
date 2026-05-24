"use client";

import {
	Award,
	Briefcase,
	Calendar,
	ChevronLeft,
	ChevronRight,
	FileText,
	Laptop,
	LogOut,
	MessageSquare,
	Moon,
	PlusCircle,
	Search,
	ShieldAlert,
	Sun,
	User,
	UserCheck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	Sidebar as ShadcnSidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
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
	currentRole: "ADMIN" | "USER";
	activeView?: "CLIENT" | "PROVIDER";
	onViewChange?: (view: "CLIENT" | "PROVIDER") => void;
	session: UserSession;
	onLogout: () => void;

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
	activeAdminTab,
	onAdminTabChange,
}: SidebarProps) {
	const { state, toggleSidebar } = useSidebar();
	const isCollapsed = state === "collapsed";
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();

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
		<ShadcnSidebar
			collapsible="icon"
			className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 ease-in-out select-none"
		>
			{/* Floating toggle button on the right edge */}
			<button
				type="button"
				onClick={toggleSidebar}
				className="absolute -right-3 top-5 h-6 w-6 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-md transition-all cursor-pointer z-50 hover:scale-105 active:scale-95"
				title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
			>
				{isCollapsed ? (
					<ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
				) : (
					<ChevronLeft className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
				)}
			</button>

			{/* Header section (Logo and Title) */}
			<SidebarHeader
				className={cn(
					"flex flex-row items-center border-b border-slate-200 dark:border-slate-800 h-16 shrink-0 transition-all duration-300",
					isCollapsed ? "justify-center p-2" : "justify-between p-4",
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
			</SidebarHeader>

			{/* Role Toggle Switch (If user has multiple roles) */}
			{currentRole !== "ADMIN" && hasClient && hasProvider && (
				<SidebarGroup className="p-3">
					{!isCollapsed ? (
						<div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-1">
							<button
								type="button"
								onClick={() => onViewChange?.("CLIENT")}
								className={cn(
									"flex-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-1",
									activeView === "CLIENT"
										? "bg-purple-600 text-white shadow-sm"
										: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
								)}
							>
								<UserCheck className="h-3 w-3" />
								<span>Client</span>
							</button>
							<button
								type="button"
								onClick={() => onViewChange?.("PROVIDER")}
								className={cn(
									"flex-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-1",
									activeView === "PROVIDER"
										? "bg-blue-600 text-white shadow-sm"
										: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
								)}
							>
								<Briefcase className="h-3 w-3" />
								<span>Editor</span>
							</button>
						</div>
					) : (
						<div className="flex justify-center relative group">
							<button
								type="button"
								onClick={() =>
									onViewChange?.(
										activeView === "CLIENT" ? "PROVIDER" : "CLIENT",
									)
								}
								className={cn(
									"p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center",
									activeView === "CLIENT"
										? "bg-purple-500/10 text-purple-400 border-purple-500/20"
										: "bg-blue-500/10 text-blue-400 border-blue-500/20",
								)}
								title={`Switch to ${activeView === "CLIENT" ? "Editor View" : "Client View"}`}
							>
								{activeView === "CLIENT" ? (
									<UserCheck className="h-4 w-4" />
								) : (
									<Briefcase className="h-4 w-4" />
								)}
							</button>
						</div>
					)}
				</SidebarGroup>
			)}

			{/* Navigation options */}
			<SidebarContent className="px-3 py-4">
				<SidebarGroup className="p-0">
					<SidebarGroupContent>
						<SidebarMenu className="gap-1">
							{currentRole === "ADMIN" ? (
								/* ADMIN NAVIGATION LINKS */
								<>
									<SidebarMenuItem>
										<SidebarMenuButton
											type="button"
											isActive={activeAdminTab === "approvals"}
											tooltip="Pending Approvals"
											onClick={() => onAdminTabChange?.("approvals")}
											className={cn(
												"w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
												activeAdminTab === "approvals"
													? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/15"
													: "text-slate-500 dark:text-slate-400",
											)}
										>
											<ShieldAlert className="h-4.5 w-4.5 shrink-0" />
											<span>Pending Approvals</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											type="button"
											isActive={activeAdminTab === "users"}
											tooltip="All Registered Users"
											onClick={() => onAdminTabChange?.("users")}
											className={cn(
												"w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
												activeAdminTab === "users"
													? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/15"
													: "text-slate-500 dark:text-slate-400",
											)}
										>
											<Users className="h-4.5 w-4.5 shrink-0" />
											<span>All Registered Users</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</>
							) : activeView === "CLIENT" ? (
								/* CLIENT NAVIGATION LINKS */
								<>
									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard#client-posted-jobs" />}
											isActive={pathname === "/dashboard"}
											tooltip="Your Posted Jobs"
										>
											<FileText className="h-4.5 w-4.5 shrink-0" />
											<span>Your Posted Jobs</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/post-job" />}
											isActive={pathname === "/dashboard/post-job"}
											tooltip="Post service request"
										>
											<PlusCircle className="h-4.5 w-4.5 shrink-0" />
											<span>Post service request</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/bid-requests" />}
											isActive={pathname === "/dashboard/bid-requests"}
											tooltip="Bid Requests"
										>
											<Award className="h-4.5 w-4.5 shrink-0" />
											<span>Bid Requests</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/search-providers" />}
											isActive={pathname === "/dashboard/search-providers"}
											tooltip="Search Providers"
										>
											<Search className="h-4.5 w-4.5 shrink-0" />
											<span>Search Providers</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/escrow" />}
											isActive={pathname === "/dashboard/escrow"}
											tooltip="Manage Escrow"
										>
											<Calendar className="h-4.5 w-4.5 shrink-0" />
											<span>Manage Escrow</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/edit-client-profile" />}
											isActive={pathname === "/dashboard/edit-client-profile"}
											tooltip="Edit Client Profile"
										>
											<User className="h-4.5 w-4.5 shrink-0" />
											<span>Edit Client Profile</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/messages" />}
											isActive={pathname.startsWith("/dashboard/messages")}
											tooltip="Messages"
										>
											<MessageSquare className="h-4.5 w-4.5 shrink-0" />
											<span>Messages</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</>
							) : (
								/* PROVIDER NAVIGATION LINKS */
								<>
									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/browse-jobs" />}
											isActive={pathname === "/dashboard/browse-jobs"}
											tooltip="Browse Jobs"
										>
											<Search className="h-4.5 w-4.5 shrink-0" />
											<span>Browse Jobs</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/my-proposals" />}
											isActive={pathname === "/dashboard/my-proposals"}
											tooltip="My Proposals"
										>
											<FileText className="h-4.5 w-4.5 shrink-0" />
											<span>My Proposals</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard#provider-contracts" />}
											isActive={pathname === "/dashboard"}
											tooltip="Active Contracts"
										>
											<Briefcase className="h-4.5 w-4.5 shrink-0" />
											<span>Active Contracts</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/edit-profile" />}
											isActive={pathname === "/dashboard/edit-profile"}
											tooltip="Professional Profile"
										>
											<User className="h-4.5 w-4.5 shrink-0" />
											<span>Professional Profile</span>
										</SidebarMenuButton>
									</SidebarMenuItem>

									<SidebarMenuItem>
										<SidebarMenuButton
											render={<Link href="/dashboard/messages" />}
											isActive={pathname.startsWith("/dashboard/messages")}
											tooltip="Messages"
										>
											<MessageSquare className="h-4.5 w-4.5 shrink-0" />
											<span>Messages</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* Footer (Theme Toggle, Session User Info, Logout) */}
			<SidebarFooter className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
				{/* Sun/Moon/Laptop Theme Selector */}
				{mounted && (
					<>
						{!isCollapsed ? (
							<div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center space-x-1">
								<button
									type="button"
									onClick={() => setTheme("light")}
									className={cn(
										"flex-1 p-1.5 rounded-md flex justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all",
										theme === "light" &&
											"bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm",
									)}
									title="Light mode"
								>
									<Sun className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setTheme("dark")}
									className={cn(
										"flex-1 p-1.5 rounded-md flex justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all",
										theme === "dark" &&
											"bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm",
									)}
									title="Dark mode"
								>
									<Moon className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setTheme("system")}
									className={cn(
										"flex-1 p-1.5 rounded-md flex justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all",
										theme === "system" &&
											"bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm",
									)}
									title="System default"
								>
									<Laptop className="h-3.5 w-3.5" />
								</button>
							</div>
						) : (
							<div className="flex justify-center">
								<button
									type="button"
									onClick={cycleTheme}
									className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all flex items-center justify-center shadow-xs"
									title={getThemeLabel()}
								>
									{getThemeIcon()}
								</button>
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
									{currentRole === "ADMIN" ? "Admin" : activeView}
								</span>
							</div>
						</div>
					) : (
						<div
							className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-slate-100 uppercase text-xs cursor-help"
							title={`${session?.email} (${currentRole === "ADMIN" ? "Admin" : activeView} Mode)`}
						>
							{session?.email ? session.email[0] : "U"}
						</div>
					)}

					{!isCollapsed && (
						<button
							type="button"
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
					<div className="flex justify-center">
						<button
							type="button"
							onClick={onLogout}
							className="p-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-destructive hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center"
							title="Sign Out"
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				)}
			</SidebarFooter>
			<SidebarRail />
		</ShadcnSidebar>
	);
}
