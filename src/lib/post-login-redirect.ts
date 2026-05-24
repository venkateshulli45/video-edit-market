export interface SessionRole {
	name: string;
	status: string;
}

export function resolvePostLoginPath(roles: SessionRole[]): string {
	const hasAdmin = roles.some(
		(role) => role.name === "ADMIN" && role.status === "approved",
	);
	const hasApprovedRole = roles.some((role) => role.status === "approved");

	if (hasAdmin) return "/admin";
	if (hasApprovedRole) return "/dashboard";
	return "/awaiting-approval";
}
