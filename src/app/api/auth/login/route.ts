import { type NextRequest, NextResponse } from "next/server";
import { comparePasswords, signJWT } from "@/lib/auth-utils";
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

		// Compare passwords
		const passwordMatch = await comparePasswords(password, user.passwordHash);
		if (!passwordMatch) {
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 },
			);
		}

		// Format roles for session payload, checking for individual role expirations
		const rolesPayload = user.userRoles.map((ur) => {
			const isExpired = ur.expiresAt && new Date(ur.expiresAt) < new Date();
			return {
				name: ur.role.name,
				status: isExpired ? "expired" : ur.status,
			};
		});

		const sessionPayload = {
			userId: user.id,
			email: user.email,
			roles: rolesPayload,
		};

		// Sign session JWT
		const token = await signJWT(sessionPayload);

		// Create Response
		const response = NextResponse.json({
			message: "Login successful",
			user: {
				id: user.id,
				email: user.email,
				roles: rolesPayload,
			},
		});

		// Set HttpOnly cookie
		response.cookies.set({
			name: "session",
			value: token,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24, // 24 hours
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
