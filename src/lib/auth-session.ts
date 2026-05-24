import { NextResponse } from "next/server";
import { signJWT, type UserSession } from "@/lib/auth-utils";

export interface SessionRole {
	name: string;
	status: string;
}

export function buildRolesPayload(
	userRoles: {
		status: string;
		expiresAt: Date | null;
		role: { name: string };
	}[],
): SessionRole[] {
	return userRoles.map((userRole) => {
		const isExpired =
			userRole.expiresAt && new Date(userRole.expiresAt) < new Date();
		return {
			name: userRole.role.name,
			status: isExpired ? "expired" : userRole.status,
		};
	});
}

export async function createSessionResponse(
	user: {
		id: string;
		email: string;
	},
	rolesPayload: SessionRole[],
	body?: Record<string, unknown>,
): Promise<NextResponse> {
	const sessionPayload: UserSession = {
		userId: user.id,
		email: user.email,
		roles: rolesPayload,
	};

	const token = await signJWT(sessionPayload);

	const response = NextResponse.json({
		message: "Login successful",
		user: {
			id: user.id,
			email: user.email,
			roles: rolesPayload,
		},
		...body,
	});

	response.cookies.set({
		name: "session",
		value: token,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24,
		path: "/",
	});

	return response;
}

export async function attachSessionCookie(
	response: NextResponse,
	user: {
		id: string;
		email: string;
	},
	rolesPayload: SessionRole[],
): Promise<NextResponse> {
	const sessionPayload: UserSession = {
		userId: user.id,
		email: user.email,
		roles: rolesPayload,
	};

	const token = await signJWT(sessionPayload);

	response.cookies.set({
		name: "session",
		value: token,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24,
		path: "/",
	});

	return response;
}
