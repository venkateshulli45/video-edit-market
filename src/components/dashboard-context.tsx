"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import { toast } from "sonner";

export interface RoleSession {
	name: string;
	status: string;
}

export interface UserSession {
	userId: string;
	email: string;
	roles: RoleSession[];
}

export interface Subcategory {
	id: string;
	name: string;
}

export interface Category {
	id: string;
	name: string;
	subcategories: Subcategory[];
}

export interface Job {
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
	pendingProposalId?: string | null;
	canEditBid?: boolean;
	_count?: { proposals: number };
}

export interface Proposal {
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
	jobId?: string;
	jobTitle?: string;
	jobBudget?: string | number;
	jobStatus?: string;
	clientName?: string;
}

export interface Provider {
	id: string;
	fullName: string;
	bio: string | null;
	skills: string[];
	hourlyRate: string | number | null;
	averageRating: string | number;
}

export interface Contract {
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

interface DashboardContextType {
	session: UserSession | null;
	activeView: "CLIENT" | "PROVIDER";
	setActiveView: (view: "CLIENT" | "PROVIDER") => void;
	isLoading: boolean;
	categories: Category[];
	postedJobs: Job[];
	contracts: Contract[];
	availableJobs: Job[];
	myProposals: Proposal[];
	providerProfile: Provider | null;
	providers: Provider[];
	fetchClientData: () => Promise<void>;
	fetchProviderData: () => Promise<void>;
	fetchSession: () => Promise<void>;
	loadCategories: () => Promise<void>;
	loadProviders: () => Promise<void>;
	handleLogout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
	undefined,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [session, setSession] = useState<UserSession | null>(null);
	const [activeView, setActiveView] = useState<"CLIENT" | "PROVIDER">("CLIENT");
	const [isLoading, setIsLoading] = useState(true);

	// Client States
	const [postedJobs, setPostedJobs] = useState<Job[]>([]);
	const [providers, setProviders] = useState<Provider[]>([]);

	// Provider States
	const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
	const [myProposals, setMyProposals] = useState<Proposal[]>([]);
	const [providerProfile, setProviderProfile] = useState<Provider | null>(null);

	// Shared States
	const [contracts, setContracts] = useState<Contract[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);

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
				(r: RoleSession) => r.status === "approved",
			);

			if (approvedRoles.length === 0) {
				router.push("/awaiting-approval");
				return;
			}

			const hasClient = approvedRoles.some(
				(r: RoleSession) => r.name === "CLIENT",
			);
			const hasProvider = approvedRoles.some(
				(r: RoleSession) => r.name === "PROVIDER",
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

	const loadCategories = useCallback(async () => {
		try {
			const res = await fetch("/api/categories");
			if (res.ok) {
				const data = await res.json();
				setCategories(data.categories || []);
			}
		} catch {
			console.error("Failed to load categories");
		}
	}, []);

	const loadProviders = useCallback(async () => {
		try {
			const res = await fetch("/api/providers");
			if (res.ok) {
				const data = await res.json();
				setProviders(data.providers || []);
			}
		} catch {
			toast.error("Failed to load service providers");
		}
	}, []);

	const handleLogout = useCallback(async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.push("/login");
		} catch {
			toast.error("Logout failed");
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

	return (
		<DashboardContext.Provider
			value={{
				session,
				activeView,
				setActiveView,
				isLoading,
				categories,
				postedJobs,
				contracts,
				availableJobs,
				myProposals,
				providerProfile,
				providers,
				fetchClientData,
				fetchProviderData,
				fetchSession,
				loadCategories,
				loadProviders,
				handleLogout,
			}}
		>
			{children}
		</DashboardContext.Provider>
	);
}

export function useDashboard() {
	const context = useContext(DashboardContext);
	if (context === undefined) {
		throw new Error("useDashboard must be used within a DashboardProvider");
	}
	return context;
}
