import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: Fetch provider profile details
export async function GET() {
	try {
		const session = await requireAuth(["PROVIDER"]);

		let profile = await db.providerProfile.findUnique({
			where: { userId: session.userId },
		});

		if (!profile) {
			// Create a default profile if it doesn't exist
			profile = await db.providerProfile.create({
				data: {
					userId: session.userId,
					fullName: "Expert Provider",
					isAvailable: true,
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
		console.error("Fetch profile error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// PATCH: Update provider profile details
export async function PATCH(req: NextRequest) {
	try {
		const session = await requireAuth(["PROVIDER"]);
		const body = await req.json();
		const {
			fullName,
			bio,
			skills,
			hourlyRate,
			isAvailable,
			phoneNumber,
			address,
		} = body;

		if (!fullName) {
			return NextResponse.json(
				{ error: "Full name is required" },
				{ status: 400 },
			);
		}

		const profile = await db.providerProfile.update({
			where: { userId: session.userId },
			data: {
				fullName,
				bio: bio || null,
				skills: Array.isArray(skills) ? skills : [],
				hourlyRate:
					hourlyRate !== undefined && hourlyRate !== ""
						? parseFloat(hourlyRate)
						: null,
				isAvailable: isAvailable !== undefined ? isAvailable : true,
				phoneNumber: phoneNumber || null,
				address: address || null,
			},
		});

		return NextResponse.json({
			message: "Profile updated successfully",
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
		console.error("Update profile error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
