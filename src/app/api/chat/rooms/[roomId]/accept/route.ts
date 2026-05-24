import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { db } from "@/lib/db";

type Params = { params: Promise<{ roomId: string }> };

// POST: Accept a chat request — add current user as ChatMember
export async function POST(req: NextRequest, { params }: Params) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { roomId } = await params;

		const room = await db.chatRoom.findUnique({
			where: { id: roomId },
			include: {
				members: true,
				_count: { select: { members: true } },
			},
		});

		if (!room) {
			return NextResponse.json({ error: "Room not found" }, { status: 404 });
		}

		// Must be a pending room (only 1 member)
		if (room._count.members !== 1) {
			return NextResponse.json(
				{ error: "This chat is already active or invalid" },
				{ status: 400 },
			);
		}

		// Must not already be a member
		if (room.members.some((m) => m.userId === session.userId)) {
			return NextResponse.json(
				{ error: "You are already a member of this chat" },
				{ status: 400 },
			);
		}

		// Verify this user has a notification for this room
		const notif = await db.notification.findFirst({
			where: {
				userId: session.userId,
				type: "message",
				title: "Chat Request",
				message: { contains: `[roomId:${roomId}]` },
			},
		});

		if (!notif) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Add the user as a member and mark notification as read
		await db.$transaction([
			db.chatMember.create({
				data: { roomId, userId: session.userId },
			}),
			db.notification.update({
				where: { id: notif.id },
				data: { isRead: true },
			}),
		]);

		return NextResponse.json({
			message: "Chat request accepted",
			roomId,
		});
	} catch (error) {
		console.error("Chat accept error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
