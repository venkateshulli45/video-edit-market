import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: Fetch client profile details
export async function GET() {
	try {
		const session = await requireAuth(["CLIENT"]);

		let profile = await db.clientProfile.findUnique({
			where: { userId: session.userId },
		});

		if (!profile) {
			// Create a default profile if it doesn't exist
			const userObj = await db.user.findUnique({
				where: { id: session.userId },
			});
			profile = await db.clientProfile.create({
				data: {
					userId: session.userId,
					fullName: userObj?.email.split("@")[0] || "Client User",
				},
			});
		}

		return NextResponse.json({ profile });
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Fetch client profile error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// PATCH: Update client profile details
export async function PATCH(req: NextRequest) {
	try {
		const session = await requireAuth(["CLIENT"]);
		const body = await req.json();
		const { fullName, phoneNumber, address } = body;

		if (!fullName) {
			return NextResponse.json(
				{ error: "Full name is required" },
				{ status: 400 },
			);
		}

		const profile = await db.clientProfile.update({
			where: { userId: session.userId },
			data: {
				fullName,
				phoneNumber: phoneNumber || null,
				address: address || null,
			},
		});

		return NextResponse.json({
			message: "Client profile updated successfully",
			profile,
		});
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (err.message === "Forbidden") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("Update client profile error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
