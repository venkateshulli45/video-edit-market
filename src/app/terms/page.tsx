import Link from "next/link";
import type { Metadata } from "next";
import { Film, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
	title: "Terms & Conditions — EditMarket",
	description:
		"Read the Terms and Conditions governing the use of the EditMarket video editing marketplace.",
};

const sections = [
	{
		title: "1. Acceptance of Terms",
		body: `By accessing or using EditMarket ("the Platform"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you may not use the Platform. We reserve the right to update these Terms at any time, and continued use of the Platform constitutes acceptance of any changes.`,
	},
	{
		title: "2. Platform Description",
		body: `EditMarket is a two-sided marketplace that connects clients seeking video editing, post-production, and related creative services with professional video editors and specialists ("Providers"). EditMarket acts solely as an intermediary and is not a party to any contract formed between clients and Providers.`,
	},
	{
		title: "3. Account Registration & Access",
		body: `Users must register for an account and request role-based access (Client or Editor/Expert). Accounts are subject to administrator approval. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must be at least 18 years old to register.`,
	},
	{
		title: "4. User Conduct",
		body: `You agree not to: (a) post false, misleading, or fraudulent content; (b) infringe any third-party intellectual property rights; (c) harass, abuse, or harm other users; (d) attempt to circumvent the Platform's payment or dispute resolution systems; (e) use automated tools to scrape or misuse Platform data; or (f) violate any applicable law or regulation.`,
	},
	{
		title: "5. Project Listings & Proposals",
		body: `Clients may post project listings describing their video editing needs. Providers may submit proposals and bids in response. EditMarket does not guarantee that any listing will receive proposals, or that any proposal will be accepted. All negotiations and agreements are between the Client and Provider.`,
	},
	{
		title: "6. Payments & Fees",
		body: `EditMarket may charge service fees on transactions completed through the Platform. Fee schedules are disclosed at checkout or in your account settings. Payments are processed through secure third-party payment processors. EditMarket is not responsible for payment processor downtime or errors.`,
	},
	{
		title: "7. Intellectual Property",
		body: `Clients retain ownership of materials they upload. Providers retain ownership of their portfolio content. Upon full payment, Providers grant Clients the rights to delivered work as specified in the project agreement. You grant EditMarket a non-exclusive licence to display your public profile content for Platform operation purposes.`,
	},
	{
		title: "8. Dispute Resolution",
		body: `In the event of a dispute between a Client and Provider, both parties agree to first attempt resolution through EditMarket's mediation process. If mediation fails, disputes shall be resolved through binding arbitration in accordance with applicable law. EditMarket's decisions in mediation are final and binding.`,
	},
	{
		title: "9. Limitation of Liability",
		body: `To the maximum extent permitted by law, EditMarket shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or any services obtained through it. EditMarket's total liability to you shall not exceed the fees paid by you in the 12 months preceding the claim.`,
	},
	{
		title: "10. Privacy",
		body: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.`,
	},
	{
		title: "11. Termination",
		body: `EditMarket reserves the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any reason deemed appropriate in our sole discretion. You may terminate your account at any time by contacting support.`,
	},
	{
		title: "12. Governing Law",
		body: `These Terms are governed by and construed in accordance with applicable law. Any disputes not resolved through arbitration shall be subject to the exclusive jurisdiction of the courts of the applicable jurisdiction.`,
	},
	{
		title: "13. Contact",
		body: `If you have any questions about these Terms, please contact us at legal@editmarket.io.`,
	},
];

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
			{/* Header */}
			<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
				<div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/register"
						className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 text-sm font-medium transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Register
					</Link>

					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-cyan-500">
							<Film className="h-4 w-4 text-white" />
						</div>
						<span className="font-black text-sm text-slate-900 dark:text-white">
							Edit
							<span className="bg-linear-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
								Market
							</span>
						</span>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-6 py-12">
				{/* Title block */}
				<div className="mb-12 text-center">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-semibold uppercase tracking-widest mb-4">
						Legal Document
					</div>
					<h1 className="text-4xl font-black mb-3">Terms &amp; Conditions</h1>
					<p className="text-slate-500 dark:text-slate-400">
						Last updated:{" "}
						<span className="font-medium text-slate-700 dark:text-slate-300">
							May 2026
						</span>
					</p>
					<p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
						Please read these terms carefully before registering on EditMarket.
						By creating an account, you confirm that you have read, understood,
						and agree to be bound by these Terms.
					</p>
				</div>

				{/* Sections */}
				<div className="space-y-8">
					{sections.map((section) => (
						<div
							key={section.title}
							className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
						>
							<h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
								<span className="w-1 h-5 rounded-full bg-linear-to-b from-violet-500 to-cyan-500 shrink-0" />
								{section.title}
							</h2>
							<p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
								{section.body}
							</p>
						</div>
					))}
				</div>

				{/* Footer CTA */}
				<div className="mt-12 text-center space-y-4">
					<p className="text-slate-500 dark:text-slate-400 text-sm">
						Also review our{" "}
						<Link
							href="/privacy"
							className="text-purple-500 hover:text-purple-400 underline underline-offset-2 font-semibold"
						>
							Privacy Policy
						</Link>
					</p>
					<Link
						href="/register"
						className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-violet-900/30 transition-all"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Registration
					</Link>
				</div>
			</div>
		</div>
	);
}
