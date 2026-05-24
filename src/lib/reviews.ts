import { db } from "@/lib/db";

export function calculateOverallRating(
	ratingQuality: number,
	ratingCommunication: number,
	ratingTimeliness: number,
): number {
	const avg = (ratingQuality + ratingCommunication + ratingTimeliness) / 3;
	return Math.round(avg * 100) / 100;
}

export function isValidRating(value: number): boolean {
	return Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function refreshProviderAverageRating(providerId: string) {
	const result = await db.review.aggregate({
		where: { revieweeId: providerId },
		_avg: { overallRating: true },
	});

	const average = result._avg.overallRating
		? Number(result._avg.overallRating)
		: 0;

	await db.providerProfile.update({
		where: { userId: providerId },
		data: { averageRating: average },
	});

	return average;
}
