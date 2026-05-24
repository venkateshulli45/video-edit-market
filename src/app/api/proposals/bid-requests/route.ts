import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: Pending bid requests for the logged-in client (from notifications + live proposal data)
export async function GET(_req: NextRequest) {
	try {
		const session = await requireAuth(["CLIENT"]);

		const pendingProposals = await db.proposal.findMany({
			where: {
				status: "pending",
				job: {
					clientId: session.userId,
					status: "posted",
				},
			},
			include: {
				job: { select: { id: true, title: true, budget: true } },
				provider: {
					select: {
						email: true,
						providerProfile: {
							select: {
								fullName: true,
								averageRating: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const unreadNotifications = await db.notification.findMany({
			where: {
				userId: session.userId,
				type: "proposal_update",
				title: "New Bid Received",
				isRead: false,
			},
			orderBy: { createdAt: "desc" },
		});

		const requests = pendingProposals.map((prop) => {
			const notif = unreadNotifications.find((n) =>
				n.message.includes(`[proposalId:${prop.id}]`),
			);
			return {
				id: prop.id,
				jobId: prop.jobId,
				jobTitle: prop.job.title,
				jobBudget: prop.job.budget,
				bidAmount: prop.bidAmount,
				estimatedDays: prop.estimatedDays,
				proposalText: prop.proposalText,
				createdAt: prop.createdAt,
				providerName:
					prop.provider.providerProfile?.fullName || prop.provider.email,
				providerRating: prop.provider.providerProfile?.averageRating || 0,
				isUnread: Boolean(notif),
				notificationId: notif?.id ?? null,
			};
		});

		return NextResponse.json({ requests });
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Bid requests error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
