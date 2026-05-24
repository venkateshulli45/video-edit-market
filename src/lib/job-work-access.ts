import { db } from "@/lib/db";

export async function canAccessJobWork(
	jobId: string,
	userId: string,
): Promise<"client" | "provider" | null> {
	const job = await db.job.findUnique({
		where: { id: jobId },
		select: { clientId: true },
	});

	if (!job) return null;
	if (job.clientId === userId) return "client";

	const contract = await db.contract.findFirst({
		where: {
			jobId,
			providerId: userId,
		},
	});

	return contract ? "provider" : null;
}
