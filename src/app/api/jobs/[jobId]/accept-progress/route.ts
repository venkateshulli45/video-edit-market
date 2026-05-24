import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function PATCH(_req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const { jobId } = await context.params;

		const job = await db.job.findUnique({
			where: { id: jobId },
			select: {
				id: true,
				title: true,
				clientId: true,
				status: true,
			},
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		if (job.clientId !== session.userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (job.status === "completed") {
			return NextResponse.json(
				{ error: "This job is already marked complete." },
				{ status: 400 },
			);
		}

		if (job.status !== "assigned" && job.status !== "in_progress") {
			return NextResponse.json(
				{
					error:
						"Progress can only be accepted after you assign an editor to this job.",
				},
				{ status: 400 },
			);
		}

		const contract = await db.contract.findFirst({
			where: {
				jobId,
				clientId: session.userId,
				status: { in: ["active", "submitted", "revision_requested"] },
			},
			include: {
				provider: {
					select: {
						id: true,
						email: true,
						providerProfile: { select: { fullName: true } },
					},
				},
			},
		});

		if (!contract) {
			return NextResponse.json(
				{ error: "No active contract found for this job." },
				{ status: 404 },
			);
		}

		const uploadCount = await db.jobWorkUpload.count({
			where: { jobId, contractId: contract.id },
		});

		if (uploadCount === 0) {
			return NextResponse.json(
				{
					error:
						"The editor has not uploaded any work yet. Accept progress after reviewing their uploads.",
				},
				{ status: 400 },
			);
		}

		const clientProfile = await db.clientProfile.findUnique({
			where: { userId: session.userId },
			select: { fullName: true },
		});
		const clientName = clientProfile?.fullName || "The client";

		await db.$transaction([
			db.contract.update({
				where: { id: contract.id },
				data: {
					status: "completed",
					endedAt: new Date(),
				},
			}),
			db.job.update({
				where: { id: jobId },
				data: { status: "completed" },
			}),
		]);

		const providerName =
			contract.provider.providerProfile?.fullName ||
			contract.provider.email;

		await db.notification.create({
			data: {
				userId: contract.providerId,
				title: "Work Accepted",
				message: `${clientName} accepted your progress on "${job.title}". This assignment is complete. [jobId:${jobId}]`,
				type: "contract_update",
			},
		});

		return NextResponse.json({
			message: `Progress accepted. ${providerName}'s work on this job is marked complete.`,
			jobStatus: "completed",
			contractStatus: "completed",
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Accept progress error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
