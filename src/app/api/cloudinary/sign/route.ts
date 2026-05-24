import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
	createUploadSignature,
	isCloudinaryConfigured,
} from "@/lib/cloudinary";

export async function GET() {
	try {
		await requireAuth(["PROVIDER"]);

		if (!isCloudinaryConfigured()) {
			return NextResponse.json(
				{
					error:
						"Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
				},
				{ status: 503 },
			);
		}

		const signature = createUploadSignature();
		return NextResponse.json(signature);
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Cloudinary sign error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
