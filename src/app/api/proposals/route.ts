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
		const mineForJob = searchParams.get("mineForJob");

		if (mineForJob) {
			const isProvider = session.roles.some(
				(r) => r.name.toUpperCase() === "PROVIDER" && r.status === "approved",
			);
			if (!isProvider) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}

			const proposal = await db.proposal.findUnique({
				where: {
					unique_job_provider_proposal: {
						jobId: mineForJob,
						providerId: session.userId,
					},
				},
			});

			if (!proposal) {
				return NextResponse.json(
					{ error: "Proposal not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json({
				proposal: {
					id: proposal.id,
					jobId: proposal.jobId,
					bidAmount: proposal.bidAmount,
					estimatedDays: proposal.estimatedDays,
					proposalText: proposal.proposalText,
					status: proposal.status,
					createdAt: proposal.createdAt,
				},
			});
		}

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
							id: true,
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
				providerUserId: prop.provider.id,
				providerName:
					prop.provider.providerProfile?.fullName || prop.provider.email,
				providerBio: prop.provider.providerProfile?.bio || "",
				providerSkills: prop.provider.providerProfile?.skills || [],
				providerRating: prop.provider.providerProfile?.averageRating || 0,
			}));

			return NextResponse.json({ proposals: formattedProposals });
		} else if (isProviderQuery) {
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

			const jobIds = proposals.map((p) => p.jobId);
			const contracts = await db.contract.findMany({
				where: {
					providerId: session.userId,
					jobId: { in: jobIds },
				},
				select: {
					id: true,
					jobId: true,
					status: true,
					clientId: true,
				},
			});

			const contractByJobId = new Map(contracts.map((c) => [c.jobId, c]));
			const contractIds = contracts.map((c) => c.id);

			const reviews = await db.review.findMany({
				where: {
					contractId: { in: contractIds },
					revieweeId: session.userId,
				},
				select: {
					contractId: true,
					overallRating: true,
					comment: true,
				},
			});

			const reviewByContractId = new Map(
				reviews.map((r) => [r.contractId, r]),
			);

			const formattedProposals = proposals.map((prop) => {
				const contract = contractByJobId.get(prop.jobId);
				const clientReview = contract
					? reviewByContractId.get(contract.id)
					: null;

				return {
					id: prop.id,
					jobId: prop.jobId,
					bidAmount: prop.bidAmount,
					estimatedDays: prop.estimatedDays,
					proposalText: prop.proposalText,
					status: prop.status,
					createdAt: prop.createdAt,
					jobTitle: prop.job.title,
					jobBudget: prop.job.budget,
					jobStatus: prop.job.status,
					contractStatus: contract?.status ?? null,
					clientName:
						prop.job.client.clientProfile?.fullName || prop.job.client.email,
					clientReview: clientReview
						? {
								overallRating: Number(clientReview.overallRating),
								comment: clientReview.comment,
							}
						: null,
				};
			});

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
			include: {
				client: {
					select: { id: true },
				},
			},
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

		const providerProfile = await db.providerProfile.findUnique({
			where: { userId: session.userId },
			select: { fullName: true },
		});

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

		const providerName = providerProfile?.fullName || "An editor";
		await db.notification.create({
			data: {
				userId: job.clientId,
				title: "New Bid Received",
				message: `${providerName} submitted a bid of $${parseFloat(bidAmount).toFixed(2)} on "${job.title}". Review and accept or decline. [jobId:${jobId}][proposalId:${proposal.id}]`,
				type: "proposal_update",
			},
		});

		return NextResponse.json({
			message: "Proposal submitted successfully. The client has been notified.",
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

// PUT: Update a pending proposal (Provider only, until client accepts)
export async function PUT(req: NextRequest) {
	try {
		const session = await requireAuth(["PROVIDER"]);
		const body = await req.json();
		const { proposalId, bidAmount, estimatedDays, proposalText } = body;

		if (!proposalId || bidAmount === undefined || !proposalText) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const proposal = await db.proposal.findUnique({
			where: { id: proposalId },
			include: { job: true },
		});

		if (!proposal) {
			return NextResponse.json(
				{ error: "Proposal not found" },
				{ status: 404 },
			);
		}

		if (proposal.providerId !== session.userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (proposal.status !== "pending") {
			return NextResponse.json(
				{ error: "Only pending bids can be edited" },
				{ status: 400 },
			);
		}

		if (proposal.job.status !== "posted") {
			return NextResponse.json(
				{ error: "Job is no longer open for bid updates" },
				{ status: 400 },
			);
		}

		const updated = await db.proposal.update({
			where: { id: proposalId },
			data: {
				bidAmount: parseFloat(bidAmount),
				estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
				proposalText,
			},
		});

		return NextResponse.json({
			message: "Bid updated successfully",
			proposal: updated,
		});
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

		if (proposal.status !== "pending") {
			return NextResponse.json(
				{ error: "This bid has already been reviewed" },
				{ status: 400 },
			);
		}

		const clientProfile = await db.clientProfile.findUnique({
			where: { userId: session.userId },
			select: { fullName: true },
		});
		const clientName = clientProfile?.fullName || "The client";

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

				await tx.notification.updateMany({
					where: {
						userId: session.userId,
						type: "proposal_update",
						message: { contains: `[proposalId:${proposalId}]` },
					},
					data: { isRead: true },
				});

				return { acceptedProp, contract };
			});

			await db.notification.create({
				data: {
					userId: proposal.providerId,
					title: "Bid Accepted",
					message: `${clientName} accepted your bid on "${proposal.job.title}". Upload work at /dashboard/deliver-work/${proposal.jobId}. [jobId:${proposal.jobId}]`,
					type: "proposal_update",
				},
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

			await db.notification.updateMany({
				where: {
					userId: session.userId,
					type: "proposal_update",
					message: { contains: `[proposalId:${proposalId}]` },
				},
				data: { isRead: true },
			});

			await db.notification.create({
				data: {
					userId: proposal.providerId,
					title: "Bid Declined",
					message: `${clientName} declined your bid on "${proposal.job.title}".`,
					type: "proposal_update",
				},
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
