import bcrypt from "bcryptjs";
import * as jose from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

function getSecretKey(): Uint8Array {
	const secret = process.env.NEXTAUTH_SECRET;
	if (secret && secret.length >= 32) {
		return new TextEncoder().encode(secret);
	}
	if (process.env.NODE_ENV === "production") {
		throw new Error("NEXTAUTH_SECRET must be set to at least 32 characters.");
	}
	return new TextEncoder().encode(
		"fallback-super-secret-key-at-least-32-chars-long",
	);
}

export interface UserSession {
	userId: string;
	email: string;
	roles: { name: string; status: string }[];
}

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

export async function comparePasswords(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function signJWT(payload: UserSession): Promise<string> {
	return new jose.SignJWT({ ...payload })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("24h") // Session valid for 24 hours
		.sign(getSecretKey());
}

export async function verifyJWT(token: string): Promise<UserSession | null> {
	try {
		const { payload } = await jose.jwtVerify(token, getSecretKey(), {
			algorithms: ["HS256"],
		});
		return payload as unknown as UserSession;
	} catch {
		return null;
	}
}

export async function getSession(
	req?: NextRequest,
): Promise<UserSession | null> {
	let token: string | undefined;

	if (req) {
		token = req.cookies.get("session")?.value;
	} else {
		// For Server Components / Server Actions
		const cookieStore = await cookies();
		token = cookieStore.get("session")?.value;
	}

	if (!token) return null;
	return verifyJWT(token);
}

export async function requireAuth(roles?: string[]): Promise<UserSession> {
	const session = await getSession();
	if (!session) {
		throw new Error("Unauthorized");
	}

	if (roles && roles.length > 0) {
		const userRoleNames = session.roles
			.filter((r) => r.status === "approved")
			.map((r) => r.name.toUpperCase());

		const hasRequiredRole = roles.some((r) =>
			userRoleNames.includes(r.toUpperCase()),
		);
		if (!hasRequiredRole) {
			throw new Error("Forbidden");
		}
	}

	return session;
}
