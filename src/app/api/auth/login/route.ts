import { type NextRequest, NextResponse } from "next/server";
import { buildRolesPayload, createSessionResponse } from "@/lib/auth-session";
import { comparePasswords } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 },
			);
		}

		// Find user and include role details
		const user = await db.user.findUnique({
			where: { email },
			include: {
				userRoles: {
					include: {
						role: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 },
			);
		}

		// Check account status
		if (!user.isActive) {
			return NextResponse.json(
				{ error: "Your account has been deactivated." },
				{ status: 403 },
			);
		}

		// Check account expiration date (end date set by Admin)
		if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
			return NextResponse.json(
				{ error: "Your account access period has ended." },
				{ status: 403 },
			);
		}

		if (!user.passwordHash) {
			return NextResponse.json(
				{
					error:
						"This account uses Google sign-in. Please continue with Google.",
				},
				{ status: 401 },
			);
		}

		const passwordMatch = await comparePasswords(password, user.passwordHash);
		if (!passwordMatch) {
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 },
			);
		}

		const rolesPayload = buildRolesPayload(user.userRoles);

		return createSessionResponse(
			{ id: user.id, email: user.email },
			rolesPayload,
		);
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
