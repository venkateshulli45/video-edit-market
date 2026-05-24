import { type NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: Fetch proposals
// ?jobId=<uuid> - returns proposals for a specific job (Client view)
// ?provider=true - returns proposals submitted by the logged-in provider (Provider view)
export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const jobId = searchParams.get("jobId");
		const isProviderQuery = searchParams.get("provider") === "true";

		if (jobId) {
			// Fetch proposals for a job, verify requester is the job owner/client
			const job = await db.job.findUnique({
				where: { id: jobId },
				select: { clientId: true },
			});

			if (!job) {
				return NextResponse.json({ error: "Job not found" }, { status: 404 });
			}

			if (job.clientId !== session.userId) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}

			const proposals = await db.proposal.findMany({
				where: { jobId },
				include: {
					provider: {
						select: {
							email: true,
							providerProfile: {
								select: {
									fullName: true,
									bio: true,
									skills: true,
									averageRating: true,
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			const formattedProposals = proposals.map((prop) => ({
				id: prop.id,
				bidAmount: prop.bidAmount,
				estimatedDays: prop.estimatedDays,
				proposalText: prop.proposalText,
				status: prop.status,
				createdAt: prop.createdAt,
				providerName:
					prop.provider.providerProfile?.fullName || prop.provider.email,
				providerBio: prop.provider.providerProfile?.bio || "",
				providerSkills: prop.provider.providerProfile?.skills || [],
				providerRating: prop.provider.providerProfile?.averageRating || 0,
			}));

			return NextResponse.json({ proposals: formattedProposals });
		} else if (isProviderQuery) {
			// Fetch proposals submitted by this provider
			const proposals = await db.proposal.findMany({
				where: { providerId: session.userId },
				include: {
					job: {
						select: {
							title: true,
							budget: true,
							status: true,
							client: {
								select: {
									clientProfile: {
										select: {
											fullName: true,
										},
									},
									email: true,
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			const formattedProposals = proposals.map((prop) => ({
				id: prop.id,
				bidAmount: prop.bidAmount,
				estimatedDays: prop.estimatedDays,
				proposalText: prop.proposalText,
				status: prop.status,
				createdAt: prop.createdAt,
				jobTitle: prop.job.title,
				jobBudget: prop.job.budget,
				jobStatus: prop.job.status,
				clientName:
					prop.job.client.clientProfile?.fullName || prop.job.client.email,
			}));

			return NextResponse.json({ proposals: formattedProposals });
		}

		return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
	} catch (error: unknown) {
		console.error("Fetch proposals error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// POST: Submit a proposal (Provider only)
export async function POST(req: NextRequest) {
	try {
		const session = await requireAuth(["PROVIDER"]);
		const body = await req.json();
		const { jobId, bidAmount, estimatedDays, proposalText } = body;

		if (!jobId || bidAmount === undefined || !proposalText) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Check if job exists and is still open ('posted')
		const job = await db.job.findUnique({
			where: { id: jobId },
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		if (job.status !== "posted") {
			return NextResponse.json(
				{ error: "Job is no longer open for bids" },
				{ status: 400 },
			);
		}

		// Check if user has already bid
		const existingProposal = await db.proposal.findUnique({
			where: {
				unique_job_provider_proposal: {
					jobId,
					providerId: session.userId,
				},
			},
		});

		if (existingProposal) {
			return NextResponse.json(
				{ error: "You have already submitted a proposal for this job" },
				{ status: 400 },
			);
		}

		const proposal = await db.proposal.create({
			data: {
				jobId,
				providerId: session.userId,
				bidAmount: parseFloat(bidAmount),
				estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
				proposalText,
				status: "pending",
			},
		});

		return NextResponse.json({
			message: "Proposal submitted successfully",
			proposal,
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Create proposal error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// PATCH: Accept or Reject a proposal (Client only)
export async function PATCH(req: NextRequest) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const body = await req.json();
		const { proposalId, action } = body; // action: 'accept' or 'reject'

		if (!proposalId || !action || !["accept", "reject"].includes(action)) {
			return NextResponse.json(
				{ error: "Invalid parameters" },
				{ status: 400 },
			);
		}

		// Find proposal and verify job owner
		const proposal = await db.proposal.findUnique({
			where: { id: proposalId },
			include: {
				job: true,
			},
		});

		if (!proposal) {
			return NextResponse.json(
				{ error: "Proposal not found" },
				{ status: 404 },
			);
		}

		if (proposal.job.clientId !== session.userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (proposal.job.status !== "posted") {
			return NextResponse.json(
				{ error: "Job is no longer open" },
				{ status: 400 },
			);
		}

		if (action === "accept") {
			// Perform accepting within a transaction:
			// 1. Accept this proposal
			// 2. Reject all other proposals for this job
			// 3. Mark job as assigned
			// 4. Create Contract
			const result = await db.$transaction(async (tx) => {
				const acceptedProp = await tx.proposal.update({
					where: { id: proposalId },
					data: { status: "accepted" },
				});

				await tx.proposal.updateMany({
					where: {
						jobId: proposal.jobId,
						id: { not: proposalId },
					},
					data: { status: "rejected" },
				});

				await tx.job.update({
					where: { id: proposal.jobId },
					data: { status: "assigned" },
				});

				const contract = await tx.contract.create({
					data: {
						jobId: proposal.jobId,
						proposalId: proposal.id,
						clientId: proposal.job.clientId,
						providerId: proposal.providerId,
						agreedPrice: proposal.bidAmount,
						status: "active",
					},
				});

				return { acceptedProp, contract };
			});

			return NextResponse.json({
				message: "Proposal accepted and contract established successfully",
				data: result,
			});
		} else {
			// Reject proposal
			const rejectedProp = await db.proposal.update({
				where: { id: proposalId },
				data: { status: "rejected" },
			});

			return NextResponse.json({
				message: "Proposal rejected successfully",
				proposal: rejectedProp,
			});
		}
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Update proposal error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
