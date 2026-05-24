import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ jobId: string }> };

async function getAssignedContract(jobId: string, providerId: string) {
	return db.contract.findFirst({
		where: {
			jobId,
			providerId,
			status: { in: ["active", "submitted", "revision_requested"] },
		},
		include: {
			job: {
				select: {
					id: true,
					title: true,
					clientId: true,
					status: true,
				},
			},
		},
	});
}

async function canAccessJobWork(
	jobId: string,
	userId: string,
): Promise<"client" | "provider" | null> {
	const job = await db.job.findUnique({
		where: { id: jobId },
		select: { clientId: true },
	});

	if (!job) return null;
	if (job.clientId === userId) return "client";

	const contract = await db.contract.findFirst({
		where: {
			jobId,
			providerId: userId,
		},
	});

	return contract ? "provider" : null;
}

export async function GET(_req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth();
		const { jobId } = await context.params;

		const access = await canAccessJobWork(jobId, session.userId);
		if (!access) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const uploads = await db.jobWorkUpload.findMany({
			where: { jobId },
			include: {
				provider: {
					select: {
						providerProfile: {
							select: { fullName: true },
						},
						email: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			uploads: uploads.map((u) => ({
				id: u.id,
				jobId: u.jobId,
				contractId: u.contractId,
				mediaType: u.mediaType,
				fileUrl: u.fileUrl,
				fileName: u.fileName,
				fileSize: u.fileSize,
				note: u.note,
				createdAt: u.createdAt,
				providerName:
					u.provider.providerProfile?.fullName || u.provider.email,
			})),
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("Fetch work uploads error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth(["PROVIDER"]);
		const { jobId } = await context.params;
		const body = await req.json();
		const { fileUrl, fileName, fileSize, mediaType, note } = body;

		if (!fileUrl || !mediaType || !["image", "video"].includes(mediaType)) {
			return NextResponse.json(
				{ error: "fileUrl and mediaType (image|video) are required" },
				{ status: 400 },
			);
		}

		if (
			typeof fileUrl !== "string" ||
			!fileUrl.startsWith("https://res.cloudinary.com/")
		) {
			return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
		}

		const contract = await getAssignedContract(jobId, session.userId);
		if (!contract) {
			return NextResponse.json(
				{
					error:
						"No active assignment for this job. The client must accept your bid first.",
				},
				{ status: 403 },
			);
		}

		const upload = await db.jobWorkUpload.create({
			data: {
				jobId,
				contractId: contract.id,
				providerId: session.userId,
				mediaType,
				fileUrl,
				fileName: fileName || null,
				fileSize: fileSize ? Number(fileSize) : null,
				note: note?.trim() || null,
			},
		});

		const providerProfile = await db.providerProfile.findUnique({
			where: { userId: session.userId },
			select: { fullName: true },
		});
		const providerName = providerProfile?.fullName || "Your editor";

		await db.notification.create({
			data: {
				userId: contract.job.clientId,
				title: "New Work Update",
				message: `${providerName} uploaded a new ${mediaType} for "${contract.job.title}". View it on your job post. [jobId:${jobId}]`,
				type: "job_update",
			},
		});

		if (contract.job.status === "assigned") {
			await db.job.update({
				where: { id: jobId },
				data: { status: "in_progress" },
			});
		}

		return NextResponse.json({
			message: "Work upload saved successfully",
			upload: {
				id: upload.id,
				jobId: upload.jobId,
				mediaType: upload.mediaType,
				fileUrl: upload.fileUrl,
				fileName: upload.fileName,
				fileSize: upload.fileSize,
				note: upload.note,
				createdAt: upload.createdAt,
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
		console.error("Create work upload error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
