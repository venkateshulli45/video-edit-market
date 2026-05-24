import type { Prisma } from "@prisma/client";
import type { GoogleUserInfo, OAuthMode } from "@/lib/google-oauth";
import { db } from "@/lib/db";

const ALLOWED_ROLES = new Set(["CLIENT", "PROVIDER"]);

function normalizeRoles(roles: string[]): string[] {
	return [...new Set(roles.map((role) => role.toUpperCase()))].filter((role) =>
		ALLOWED_ROLES.has(role),
	);
}

async function assignRolesToUser(
	tx: Prisma.TransactionClient,
	userId: string,
	requestedRoles: string[],
	fullName: string,
	avatarUrl?: string,
) {
	const rolesToAssign = await tx.role.findMany({
		where: {
			name: {
				in: requestedRoles,
			},
		},
	});

	for (const role of rolesToAssign) {
		const existingUserRole = await tx.userRole.findUnique({
			where: {
				userId_roleId: {
					userId,
					roleId: role.id,
				},
			},
		});

		if (!existingUserRole) {
			await tx.userRole.create({
				data: {
					userId,
					roleId: role.id,
					status: "pending",
				},
			});
		}

		if (role.name === "CLIENT") {
			await tx.clientProfile.upsert({
				where: { userId },
				create: {
					userId,
					fullName,
					avatarUrl,
				},
				update: {
					fullName,
					...(avatarUrl ? { avatarUrl } : {}),
				},
			});
		} else if (role.name === "PROVIDER") {
			await tx.providerProfile.upsert({
				where: { userId },
				create: {
					userId,
					fullName,
					avatarUrl,
				},
				update: {
					fullName,
					...(avatarUrl ? { avatarUrl } : {}),
				},
			});
		}
	}
}

export class OAuthUserError extends Error {
	constructor(
		message: string,
		public code:
			| "account_not_found"
			| "roles_required"
			| "account_inactive"
			| "account_expired",
	) {
		super(message);
	}
}

export async function resolveGoogleUser(
	googleUser: GoogleUserInfo,
	mode: OAuthMode,
	requestedRoles: string[],
	fullName: string,
) {
	const normalizedEmail = googleUser.email.trim().toLowerCase();
	const displayName = fullName || googleUser.name || normalizedEmail.split("@")[0];

	const existingByGoogleId = await db.user.findUnique({
		where: { googleId: googleUser.sub },
		include: {
			userRoles: {
				include: { role: true },
			},
		},
	});

	if (existingByGoogleId) {
		return finalizeExistingUser(existingByGoogleId, googleUser);
	}

	const existingByEmail = await db.user.findUnique({
		where: { email: normalizedEmail },
		include: {
			userRoles: {
				include: { role: true },
			},
		},
	});

	if (existingByEmail) {
		const linkedUser = await db.user.update({
			where: { id: existingByEmail.id },
			data: {
				googleId: googleUser.sub,
			},
			include: {
				userRoles: {
					include: { role: true },
				},
			},
		});

		return finalizeExistingUser(linkedUser, googleUser);
	}

	if (mode === "login") {
		throw new OAuthUserError(
			"No account found for this Google email. Please register first.",
			"account_not_found",
		);
	}

	const roles = normalizeRoles(requestedRoles);
	if (roles.length === 0) {
		throw new OAuthUserError(
			"Select at least one workspace role before continuing with Google.",
			"roles_required",
		);
	}

	const newUser = await db.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				email: normalizedEmail,
				googleId: googleUser.sub,
				isActive: true,
			},
		});

		await assignRolesToUser(
			tx,
			user.id,
			roles,
			displayName,
			googleUser.picture,
		);

		return tx.user.findUniqueOrThrow({
			where: { id: user.id },
			include: {
				userRoles: {
					include: { role: true },
				},
			},
		});
	});

	return finalizeExistingUser(newUser, googleUser);
}

function finalizeExistingUser(
	user: {
		id: string;
		email: string;
		isActive: boolean;
		expiresAt: Date | null;
		userRoles: {
			status: string;
			expiresAt: Date | null;
			role: { name: string };
		}[];
	},
	_googleUser: GoogleUserInfo,
) {
	if (!user.isActive) {
		throw new OAuthUserError(
			"Your account has been deactivated.",
			"account_inactive",
		);
	}

	if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
		throw new OAuthUserError(
			"Your account access period has ended.",
			"account_expired",
		);
	}

	return user;
}
