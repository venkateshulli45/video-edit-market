import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export type ChatRequestStatus =
	| "none"
	| "pending_outgoing"
	| "pending_incoming"
	| "active";

// GET ?targetUserId= — relationship between current user and target for chat
export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const targetUserId = new URL(req.url).searchParams.get("targetUserId");
		if (!targetUserId) {
			return NextResponse.json(
				{ error: "targetUserId is required" },
				{ status: 400 },
			);
		}

		if (targetUserId === session.userId) {
			return NextResponse.json({ status: "none" as ChatRequestStatus });
		}

		// Active chat: both users are members
		const activeRoom = await db.chatRoom.findFirst({
			where: {
				AND: [
					{ members: { some: { userId: session.userId } } },
					{ members: { some: { userId: targetUserId } } },
				],
			},
			include: { _count: { select: { members: true } } },
		});

		if (activeRoom && activeRoom._count.members >= 2) {
			return NextResponse.json({
				status: "active" as ChatRequestStatus,
				roomId: activeRoom.id,
			});
		}

		// Pending outgoing: sole-member room I started, notification to target
		const myPendingRooms = await db.chatRoom.findMany({
			where: {
				members: { some: { userId: session.userId } },
			},
			include: {
				_count: { select: { members: true } },
				members: { select: { userId: true } },
			},
		});

		for (const room of myPendingRooms) {
			if (room._count.members !== 1) continue;
			const notif = await db.notification.findFirst({
				where: {
					userId: targetUserId,
					type: "message",
					title: "Chat Request",
					message: { contains: `[roomId:${room.id}]` },
				},
			});
			if (notif) {
				return NextResponse.json({
					status: "pending_outgoing" as ChatRequestStatus,
					roomId: room.id,
				});
			}
		}

		// Pending incoming: target initiated, I have notification
		const incomingNotifs = await db.notification.findMany({
			where: {
				userId: session.userId,
				type: "message",
				title: "Chat Request",
				isRead: false,
			},
		});

		for (const notif of incomingNotifs) {
			const match = notif.message.match(/\[roomId:([^\]]+)\]/);
			if (!match) continue;
			const room = await db.chatRoom.findUnique({
				where: { id: match[1] },
				include: {
					_count: { select: { members: true } },
					members: { select: { userId: true } },
				},
			});
			if (
				room &&
				room._count.members === 1 &&
				room.members[0]?.userId === targetUserId
			) {
				return NextResponse.json({
					status: "pending_incoming" as ChatRequestStatus,
					roomId: room.id,
				});
			}
		}

		return NextResponse.json({ status: "none" as ChatRequestStatus });
	} catch (error) {
		console.error("Chat status GET error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
