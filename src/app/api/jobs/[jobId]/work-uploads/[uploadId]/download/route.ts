import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { safeDownloadFilename } from "@/lib/cloudinary-download";
import { canAccessJobWork } from "@/lib/job-work-access";
import { db } from "@/lib/db";

type RouteContext = {
	params: Promise<{ jobId: string; uploadId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
	try {
		const session = await requireAuth();
		const { jobId, uploadId } = await context.params;

		const access = await canAccessJobWork(jobId, session.userId);
		if (!access) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const upload = await db.jobWorkUpload.findFirst({
			where: { id: uploadId, jobId },
			select: {
				fileUrl: true,
				fileName: true,
				mediaType: true,
			},
		});

		if (!upload) {
			return NextResponse.json({ error: "Upload not found" }, { status: 404 });
		}

		const fileName = safeDownloadFilename(
			upload.fileName ||
				`work-${upload.mediaType}-${uploadId.slice(0, 8)}.${upload.mediaType === "video" ? "mp4" : "jpg"}`,
		);

		const upstream = await fetch(upload.fileUrl);
		if (!upstream.ok) {
			console.error(
				"Cloudinary fetch failed:",
				upstream.status,
				upload.fileUrl,
			);
			return NextResponse.json(
				{ error: "Could not fetch file for download" },
				{ status: 502 },
			);
		}

		const contentType =
			upstream.headers.get("content-type") ||
			(upload.mediaType === "video" ? "video/mp4" : "image/jpeg");

		const headers = new Headers();
		headers.set("Content-Type", contentType);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
		);

		const contentLength = upstream.headers.get("content-length");
		if (contentLength) {
			headers.set("Content-Length", contentLength);
		}

		return new NextResponse(upstream.body, {
			status: 200,
			headers,
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("Work upload download error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
