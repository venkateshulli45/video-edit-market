import { NextResponse } from "next/server";
import { attachSessionCookie, buildRolesPayload } from "@/lib/auth-session";
import { getAppBaseUrl } from "@/lib/app-url";
import {
	exchangeGoogleCode,
	fetchGoogleUserInfo,
	OAUTH_STATE_COOKIE,
	verifyOAuthState,
} from "@/lib/google-oauth";
import { OAuthUserError, resolveGoogleUser } from "@/lib/oauth-user";
import { resolvePostLoginPath } from "@/lib/post-login-redirect";
import { cookies } from "next/headers";

function redirectWithError(path: string, message: string) {
	const url = new URL(path, getAppBaseUrl());
	url.searchParams.set("error", message);
	return NextResponse.redirect(url);
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const oauthError = searchParams.get("error");

	if (oauthError) {
		return redirectWithError(
			"/login",
			"Google sign-in was cancelled or denied.",
		);
	}

	if (!code || !state) {
		return redirectWithError("/login", "Missing Google OAuth response.");
	}

	const cookieStore = await cookies();
	const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
	const verifiedState = verifyOAuthState(state);

	if (!storedState || storedState !== state || !verifiedState) {
		return redirectWithError("/login", "Invalid OAuth state. Please try again.");
	}

	try {
		const { accessToken } = await exchangeGoogleCode(code);
		const googleUser = await fetchGoogleUserInfo(accessToken);

		if (googleUser.email_verified === false) {
			return redirectWithError(
				verifiedState.mode === "register" ? "/register" : "/login",
				"Your Google email must be verified.",
			);
		}

		const user = await resolveGoogleUser(
			googleUser,
			verifiedState.mode,
			verifiedState.roles,
			verifiedState.fullName,
		);

		const rolesPayload = buildRolesPayload(user.userRoles);
		const redirectPath = resolvePostLoginPath(rolesPayload);
		const response = NextResponse.redirect(new URL(redirectPath, getAppBaseUrl()));

		response.cookies.delete(OAUTH_STATE_COOKIE);
		await attachSessionCookie(response, user, rolesPayload);

		return response;
	} catch (error) {
		if (error instanceof OAuthUserError) {
			const path = error.code === "account_not_found" ? "/register" : "/login";
			return redirectWithError(path, error.message);
		}

		console.error("Google OAuth callback error:", error);
		return redirectWithError(
			"/login",
			"Google sign-in failed. Please try again.",
		);
	}
}
