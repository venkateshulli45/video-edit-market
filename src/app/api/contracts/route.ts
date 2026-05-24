import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: Fetch all active contracts for the logged-in user (both client & provider)
export async function GET() {
	try {
		const session = await requireAuth();

		const contracts = await db.contract.findMany({
			where: {
				OR: [{ clientId: session.userId }, { providerId: session.userId }],
			},
			include: {
				job: {
					select: {
						id: true,
						title: true,
						description: true,
					},
				},
				client: {
					select: {
						email: true,
						clientProfile: {
							select: {
								fullName: true,
							},
						},
					},
				},
				provider: {
					select: {
						email: true,
						providerProfile: {
							select: {
								fullName: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Format output
		const formattedContracts = contracts.map((c) => ({
			id: c.id,
			jobId: c.job.id,
			jobTitle: c.job.title,
			jobDescription: c.job.description,
			clientId: c.clientId,
			providerId: c.providerId,
			agreedPrice: c.agreedPrice,
			status: c.status,
			startedAt: c.startedAt,
			clientName: c.client.clientProfile?.fullName || c.client.email,
			providerName: c.provider.providerProfile?.fullName || c.provider.email,
		}));

		return NextResponse.json({ contracts: formattedContracts });
	} catch (error: unknown) {
		const err = error as Error;
		if (err.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("Fetch contracts error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
