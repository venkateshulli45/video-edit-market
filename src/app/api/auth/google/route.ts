import { type NextRequest, NextResponse } from "next/server";
import {
	buildGoogleAuthUrl,
	createOAuthState,
	isGoogleOAuthConfigured,
	OAUTH_STATE_COOKIE,
	signOAuthState,
	type OAuthMode,
} from "@/lib/google-oauth";

function parseRoles(value: string | null): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((role) => role.trim().toUpperCase())
		.filter(Boolean);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const mode = (searchParams.get("mode") ?? "login") as OAuthMode;

	if (!isGoogleOAuthConfigured()) {
		const path = mode === "register" ? "/register" : "/login";
		return NextResponse.redirect(
			new URL(
				`${path}?error=${encodeURIComponent("Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then restart the dev server.")}`,
				req.url,
			),
		);
	}
	const roles = parseRoles(searchParams.get("roles"));
	const fullName = searchParams.get("fullName")?.trim() ?? "";

	if (mode !== "login" && mode !== "register") {
		return NextResponse.json({ error: "Invalid OAuth mode" }, { status: 400 });
	}

	if (mode === "register" && roles.length === 0) {
		return NextResponse.redirect(
			new URL("/register?error=Select at least one role before using Google.", req.url),
		);
	}

	const signedState = signOAuthState(
		createOAuthState({
			mode,
			roles,
			fullName,
		}),
	);

	const response = NextResponse.redirect(buildGoogleAuthUrl(signedState));
	response.cookies.set({
		name: OAUTH_STATE_COOKIE,
		value: signedState,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 10,
		path: "/",
	});

	return response;
}
