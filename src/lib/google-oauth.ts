import { createHmac, randomBytes } from "node:crypto";
import { getAppBaseUrl } from "@/lib/app-url";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
export const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_SCOPES = ["openid", "email", "profile"];

export type OAuthMode = "login" | "register";

export interface OAuthStatePayload {
	mode: OAuthMode;
	roles: string[];
	fullName: string;
	nonce: string;
}

export interface GoogleUserInfo {
	sub: string;
	email: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
}

function getOAuthSecret(): string {
	const secret = process.env.NEXTAUTH_SECRET;
	if (secret && secret.length >= 32) {
		return secret;
	}
	if (process.env.NODE_ENV === "production") {
		throw new Error("NEXTAUTH_SECRET must be set to at least 32 characters.");
	}
	return "fallback-super-secret-key-at-least-32-chars-long";
}

export function isGoogleOAuthConfigured(): boolean {
	return Boolean(
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
	);
}

export function getGoogleRedirectUri(): string {
	return `${getAppBaseUrl()}/api/auth/google/callback`;
}

export function createOAuthState(
	payload: Omit<OAuthStatePayload, "nonce">,
): OAuthStatePayload {
	return {
		...payload,
		nonce: randomBytes(16).toString("hex"),
	};
}

export function signOAuthState(state: OAuthStatePayload): string {
	const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
	const signature = createHmac("sha256", getOAuthSecret())
		.update(payload)
		.digest("base64url");
	return `${payload}.${signature}`;
}

export function verifyOAuthState(value: string): OAuthStatePayload | null {
	const [payload, signature] = value.split(".");
	if (!payload || !signature) return null;

	const expectedSignature = createHmac("sha256", getOAuthSecret())
		.update(payload)
		.digest("base64url");

	if (signature !== expectedSignature) return null;

	try {
		const parsed = JSON.parse(
			Buffer.from(payload, "base64url").toString("utf8"),
		) as OAuthStatePayload;

		if (
			(parsed.mode !== "login" && parsed.mode !== "register") ||
			!Array.isArray(parsed.roles) ||
			typeof parsed.fullName !== "string" ||
			typeof parsed.nonce !== "string"
		) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

export function buildGoogleAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: process.env.GOOGLE_CLIENT_ID ?? "",
		redirect_uri: getGoogleRedirectUri(),
		response_type: "code",
		scope: OAUTH_SCOPES.join(" "),
		access_type: "online",
		prompt: "select_account",
		state,
	});

	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
	code: string,
): Promise<{ accessToken: string }> {
	const response = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			code,
			client_id: process.env.GOOGLE_CLIENT_ID ?? "",
			client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			redirect_uri: getGoogleRedirectUri(),
			grant_type: "authorization_code",
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Google token exchange failed: ${errorBody}`);
	}

	const data = (await response.json()) as { access_token?: string };
	if (!data.access_token) {
		throw new Error("Google token exchange returned no access token");
	}

	return { accessToken: data.access_token };
}

export async function fetchGoogleUserInfo(
	accessToken: string,
): Promise<GoogleUserInfo> {
	const response = await fetch(GOOGLE_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Google userinfo failed: ${errorBody}`);
	}

	const data = (await response.json()) as GoogleUserInfo;
	if (!data.sub || !data.email) {
		throw new Error("Google userinfo missing required fields");
	}

	return data;
}
