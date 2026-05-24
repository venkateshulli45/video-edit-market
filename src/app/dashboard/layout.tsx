"use client";

import { useDashboard } from "@/components/dashboard-context";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { DashboardProvider } from "@/components/dashboard-context";
import type React from "react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
	const { session, activeView, setActiveView, handleLogout, isLoading } =
		useDashboard();

	if (isLoading || !session) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
				Loading workspace dashboard...
			</div>
		);
	}

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
				/>

				{/* Main Workspace Dashboard Content */}
				<main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 transition-all duration-200">
					{/* Mobile sidebar trigger */}
					<div className="md:hidden mb-4">
						<SidebarTrigger className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg" />
					</div>
					{children}
				</main>
			</div>
		</SidebarProvider>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DashboardProvider>
			<DashboardLayoutContent>{children}</DashboardLayoutContent>
		</DashboardProvider>
	);
}
