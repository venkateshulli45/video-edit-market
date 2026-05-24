import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
	calculateOverallRating,
	isValidRating,
	refreshProviderAverageRating,
} from "@/lib/reviews";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ jobId: string }> };

async function getCompletedContract(jobId: string, clientId: string) {
	return db.contract.findFirst({
		where: {
			jobId,
			clientId,
			status: "completed",
		},
		include: {
			provider: {
				select: {
					id: true,
					email: true,
					providerProfile: { select: { fullName: true } },
				},
			},
			job: { select: { title: true, status: true } },
		},
	});
}

export async function GET(req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth();
		const { jobId } = await context.params;
		const view = new URL(req.url).searchParams.get("view");

		const approvedRoles = session.roles
			.filter((r) => r.status === "approved")
			.map((r) => r.name.toUpperCase());

		if (view === "provider" && approvedRoles.includes("PROVIDER")) {
			const contract = await db.contract.findFirst({
				where: {
					jobId,
					providerId: session.userId,
					status: { in: ["active", "submitted", "revision_requested", "completed"] },
				},
				include: {
					job: { select: { status: true, title: true } },
					client: {
						select: {
							email: true,
							clientProfile: { select: { fullName: true } },
						},
					},
				},
			});

			if (!contract) {
				return NextResponse.json({
					canView: false,
					clientReview: null,
					awaitingReview: false,
				});
			}

			const clientReview = await db.review.findFirst({
				where: {
					contractId: contract.id,
					revieweeId: session.userId,
					reviewerId: contract.clientId,
				},
			});

			return NextResponse.json({
				canView: true,
				jobStatus: contract.job.status,
				contractStatus: contract.status,
				clientName:
					contract.client.clientProfile?.fullName || contract.client.email,
				awaitingReview:
					contract.status === "completed" && contract.job.status === "completed",
				clientReview: clientReview
					? {
							overallRating: Number(clientReview.overallRating),
							ratingQuality: clientReview.ratingQuality,
							ratingCommunication: clientReview.ratingCommunication,
							ratingTimeliness: clientReview.ratingTimeliness,
							comment: clientReview.comment,
							createdAt: clientReview.createdAt,
						}
					: null,
			});
		}

		if (!approvedRoles.includes("CLIENT")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const contract = await getCompletedContract(jobId, session.userId);
		if (!contract) {
			return NextResponse.json({
				canReview: false,
				review: null,
				providerName: null,
			});
		}

		const existing = await db.review.findUnique({
			where: {
				unique_contract_reviewer: {
					contractId: contract.id,
					reviewerId: session.userId,
				},
			},
		});

		return NextResponse.json({
			canReview: true,
			contractId: contract.id,
			providerName:
				contract.provider.providerProfile?.fullName ||
				contract.provider.email,
			review: existing
				? {
						id: existing.id,
						ratingQuality: existing.ratingQuality,
						ratingCommunication: existing.ratingCommunication,
						ratingTimeliness: existing.ratingTimeliness,
						overallRating: Number(existing.overallRating),
						comment: existing.comment,
						createdAt: existing.createdAt,
					}
				: null,
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Fetch review error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const { jobId } = await context.params;
		const body = await req.json();
		const { ratingQuality, ratingCommunication, ratingTimeliness, comment } =
			body;

		const contract = await getCompletedContract(jobId, session.userId);
		if (!contract) {
			return NextResponse.json(
				{
					error:
						"You can review the editor after the project is marked complete.",
				},
				{ status: 400 },
			);
		}

		if (contract.job.status !== "completed") {
			return NextResponse.json(
				{ error: "Accept the editor's progress before leaving a review." },
				{ status: 400 },
			);
		}

		const existing = await db.review.findUnique({
			where: {
				unique_contract_reviewer: {
					contractId: contract.id,
					reviewerId: session.userId,
				},
			},
		});

		if (existing) {
			return NextResponse.json(
				{ error: "You have already reviewed this editor for this project." },
				{ status: 400 },
			);
		}

		const ratings = [ratingQuality, ratingCommunication, ratingTimeliness].map(
			Number,
		);
		if (!ratings.every(isValidRating)) {
			return NextResponse.json(
				{
					error:
						"Each rating (quality, communication, timeliness) must be between 1 and 5.",
				},
				{ status: 400 },
			);
		}

		const [quality, communication, timeliness] = ratings;
		const overallRating = calculateOverallRating(
			quality,
			communication,
			timeliness,
		);

		const review = await db.review.create({
			data: {
				contractId: contract.id,
				reviewerId: session.userId,
				revieweeId: contract.providerId,
				ratingQuality: quality,
				ratingCommunication: communication,
				ratingTimeliness: timeliness,
				overallRating,
				comment: comment?.trim() || null,
			},
		});

		const newAverage = await refreshProviderAverageRating(contract.providerId);

		const clientProfile = await db.clientProfile.findUnique({
			where: { userId: session.userId },
			select: { fullName: true },
		});
		const clientName = clientProfile?.fullName || "A client";

		await db.notification.create({
			data: {
				userId: contract.providerId,
				title: "New review received",
				message: `${clientName} left a ${overallRating.toFixed(1)}★ review on "${contract.job.title}". [jobId:${jobId}]`,
				type: "contract_update",
			},
		});

		return NextResponse.json({
			message: "Thank you! Your review has been submitted.",
			review: {
				id: review.id,
				ratingQuality: review.ratingQuality,
				ratingCommunication: review.ratingCommunication,
				ratingTimeliness: review.ratingTimeliness,
				overallRating: Number(review.overallRating),
				comment: review.comment,
				createdAt: review.createdAt,
			},
			providerAverageRating: newAverage,
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Submit review error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
