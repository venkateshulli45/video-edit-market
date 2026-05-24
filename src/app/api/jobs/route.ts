import { type NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: Fetch jobs
// If query param ?client=true is passed, returns jobs posted by the logged-in client.
// Otherwise, returns all jobs with status 'posted' for providers to browse.
export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const isClientQuery = searchParams.get("client") === "true";

		if (isClientQuery) {
			// Fetch client's posted jobs
			const jobs = await db.job.findMany({
				where: {
					clientId: session.userId,
				},
				include: {
					category: {
						select: {
							name: true,
						},
					},
					_count: {
						select: {
							proposals: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return NextResponse.json({ jobs });
		} else {
			// Fetch available jobs for providers (excluding jobs they've already bid on or jobs they posted)
			// Wait, let's just fetch all 'posted' jobs, and we can filter or display them
			const jobs = await db.job.findMany({
				where: {
					status: "posted",
					NOT: {
						clientId: session.userId, // Can't bid on own jobs
					},
				},
				include: {
					category: {
						select: {
							name: true,
						},
					},
					client: {
						select: {
							id: true,
							email: true,
							clientProfile: {
								select: {
									fullName: true,
								},
							},
						},
					},
					proposals: {
						where: {
							providerId: session.userId,
						},
						select: {
							id: true,
							status: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			// Format to indicate if current provider has already bid on it
			const formattedJobs = jobs.map((job) => ({
				id: job.id,
				title: job.title,
				description: job.description,
				budget: job.budget,
				pricingModel: job.pricingModel,
				deadline: job.deadline,
				location: job.location,
				status: job.status,
				createdAt: job.createdAt,
				category: job.category,
				clientName: job.client.clientProfile?.fullName || job.client.email,
				clientUserId: job.client.id,
				hasBid: job.proposals.length > 0,
				pendingProposalId:
					job.proposals.find((p) => p.status === "pending")?.id ?? null,
				canEditBid: job.proposals.some((p) => p.status === "pending"),
			}));

			return NextResponse.json({ jobs: formattedJobs });
		}
	} catch (error: unknown) {
		console.error("Fetch jobs error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// POST: Create a new job post (Client only)
export async function POST(req: NextRequest) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const body = await req.json();
		const {
			title,
			description,
			categoryId,
			pricingModel,
			budget,
			deadline,
			location,
		} = body;

		if (
			!title ||
			!description ||
			!categoryId ||
			!pricingModel ||
			budget === undefined
		) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const job = await db.job.create({
			data: {
				clientId: session.userId,
				categoryId,
				title,
				description,
				pricingModel,
				budget: parseFloat(budget),
				deadline: deadline ? new Date(deadline) : null,
				location: location || null,
				status: "posted",
			},
		});

		return NextResponse.json({
			message: "Job posted successfully",
			job,
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Create job error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
