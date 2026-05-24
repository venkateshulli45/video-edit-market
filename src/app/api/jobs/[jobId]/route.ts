import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const { jobId } = await context.params;

		const job = await db.job.findUnique({
			where: { id: jobId },
			include: {
				category: {
					select: { id: true, name: true },
				},
			},
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		if (job.clientId !== session.userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json({
			job: {
				id: job.id,
				title: job.title,
				description: job.description,
				categoryId: job.categoryId,
				categoryName: job.category.name,
				pricingModel: job.pricingModel,
				budget: job.budget,
				deadline: job.deadline,
				location: job.location,
				status: job.status,
				createdAt: job.createdAt,
			},
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Fetch job error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const { jobId } = await context.params;
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

		const existing = await db.job.findUnique({
			where: { id: jobId },
			select: { clientId: true, status: true },
		});

		if (!existing) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		if (existing.clientId !== session.userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (existing.status !== "posted") {
			return NextResponse.json(
				{
					error:
						"This job can no longer be edited after a bid has been accepted.",
				},
				{ status: 400 },
			);
		}

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

		const job = await db.job.update({
			where: { id: jobId },
			data: {
				title,
				description,
				categoryId,
				pricingModel,
				budget: parseFloat(budget),
				deadline: deadline ? new Date(deadline) : null,
				location: location || null,
			},
			include: {
				category: { select: { name: true } },
			},
		});

		return NextResponse.json({
			message: "Job post updated successfully",
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
		console.error("Update job error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
