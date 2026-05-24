import Link from "next/link";
import type { Metadata } from "next";
import { Film, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
	title: "Privacy Policy — EditMarket",
	description:
		"Learn how EditMarket collects, uses, and protects your personal data.",
};

const sections = [
	{
		title: "1. Information We Collect",
		body: `We collect information you provide directly, such as your name, email address, password, and professional profile details. We also collect usage data including pages visited, features used, and device/browser information through cookies and analytics tools.`,
	},
	{
		title: "2. How We Use Your Information",
		body: `We use your information to: (a) operate and improve the Platform; (b) match clients with suitable editors; (c) process payments and prevent fraud; (d) send transactional and service-related communications; (e) comply with legal obligations.`,
	},
	{
		title: "3. Sharing Your Information",
		body: `We do not sell your personal data. We share data with: (a) other users as needed to facilitate project collaboration (e.g., your profile is visible to clients); (b) third-party service providers acting on our behalf (payment processors, hosting, analytics); (c) law enforcement when legally required.`,
	},
	{
		title: "4. Cookies & Tracking",
		body: `We use cookies and similar technologies for authentication, session management, and analytics. You can control cookie preferences through your browser settings, though disabling certain cookies may affect Platform functionality.`,
	},
	{
		title: "5. Data Retention",
		body: `We retain your data for as long as your account is active or as needed to provide services. You may request account deletion at any time, after which we will anonymise or delete your personal data within 30 days, except where retention is required by law.`,
	},
	{
		title: "6. Security",
		body: `We implement industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security reviews. No system is perfectly secure; you use the Platform at your own risk.`,
	},
	{
		title: "7. Your Rights",
		body: `Depending on your jurisdiction, you may have rights to: access, correct, or delete your personal data; object to or restrict certain processing; and data portability. To exercise these rights, contact us at privacy@editmarket.io.`,
	},
	{
		title: "8. Children's Privacy",
		body: `The Platform is not directed to individuals under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately.`,
	},
	{
		title: "9. Changes to This Policy",
		body: `We may update this Privacy Policy from time to time. We will notify registered users of material changes via email or an in-app notice. Continued use of the Platform after changes constitutes acceptance.`,
	},
	{
		title: "10. Contact",
		body: `For privacy-related questions or requests, contact our Data Protection team at privacy@editmarket.io.`,
	},
];

export default function PrivacyPage() {
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
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
						Legal Document
					</div>
					<h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
					<p className="text-slate-500 dark:text-slate-400">
						Last updated:{" "}
						<span className="font-medium text-slate-700 dark:text-slate-300">
							May 2026
						</span>
					</p>
					<p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
						Your privacy matters to us. This policy explains what data we
						collect, how we use it, and how we keep it safe.
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
								<span className="w-1 h-5 rounded-full bg-linear-to-b from-cyan-500 to-violet-500 shrink-0" />
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
							href="/terms"
							className="text-purple-500 hover:text-purple-400 underline underline-offset-2 font-semibold"
						>
							Terms &amp; Conditions
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
