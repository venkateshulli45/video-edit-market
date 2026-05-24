/**
 * Base URL for redirects and OAuth callbacks.
 * On Vercel, never use localhost from NEXTAUTH_URL — use the deployment host instead.
 */
export function getAppBaseUrl(): string {
	const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");

	if (process.env.VERCEL) {
		const vercelHost =
			process.env.VERCEL_ENV === "production"
				? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
				: process.env.VERCEL_URL;

		if (vercelHost) {
			const vercelBase = vercelHost.startsWith("http")
				? vercelHost
				: `https://${vercelHost}`;

			// Common mistake: NEXTAUTH_URL still set to localhost on Vercel
			if (!nextAuthUrl || nextAuthUrl.includes("localhost")) {
				return vercelBase.replace(/\/$/, "");
			}
		}
	}

	if (nextAuthUrl) {
		return nextAuthUrl;
	}

	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
	}

	return "http://localhost:3000";
}
