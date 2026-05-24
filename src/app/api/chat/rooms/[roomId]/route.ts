import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { db } from "@/lib/db";

type Params = { params: Promise<{ roomId: string }> };

// GET: Get room details + messages (only if user is a member or target of pending)
export async function GET(req: NextRequest, { params }: Params) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { roomId } = await params;

		const room = await db.chatRoom.findUnique({
			where: { id: roomId },
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								email: true,
								clientProfile: { select: { fullName: true, avatarUrl: true } },
								providerProfile: {
									select: { fullName: true, avatarUrl: true },
								},
							},
						},
					},
				},
				messages: {
					orderBy: { createdAt: "asc" },
					include: {
						sender: {
							select: {
								id: true,
								email: true,
								clientProfile: { select: { fullName: true, avatarUrl: true } },
								providerProfile: {
									select: { fullName: true, avatarUrl: true },
								},
							},
						},
					},
				},
				_count: { select: { members: true } },
			},
		});

		if (!room) {
			return NextResponse.json({ error: "Room not found" }, { status: 404 });
		}

		const isMember = room.members.some((m) => m.userId === session.userId);
		const isPending = room._count.members === 1;

		// If active, only members can view
		if (!isPending && !isMember) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// If pending and NOT the initiator, check that this user has a notification for it
		if (isPending && !isMember) {
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
		}

		const otherMember = room.members.find((m) => m.userId !== session.userId);
		const otherUser = otherMember?.user;
		const otherName =
			otherUser?.clientProfile?.fullName ||
			otherUser?.providerProfile?.fullName ||
			otherUser?.email ||
			"Unknown";
		const otherAvatar =
			otherUser?.clientProfile?.avatarUrl ||
			otherUser?.providerProfile?.avatarUrl ||
			null;

		const messages = room.messages.map((msg) => ({
			id: msg.id,
			text: msg.messageText,
			fileUrl: msg.fileUrl,
			fileName: msg.fileName,
			createdAt: msg.createdAt,
			senderId: msg.senderId,
			senderName:
				msg.sender.clientProfile?.fullName ||
				msg.sender.providerProfile?.fullName ||
				msg.sender.email,
			senderAvatar:
				msg.sender.clientProfile?.avatarUrl ||
				msg.sender.providerProfile?.avatarUrl ||
				null,
			isMe: msg.senderId === session.userId,
		}));

		return NextResponse.json({
			room: {
				id: room.id,
				isPending,
				iAmMember: isMember,
				otherUserId: otherUser?.id ?? null,
				otherName,
				otherAvatar,
				otherEmail: otherUser?.email ?? null,
				createdAt: room.createdAt,
			},
			messages,
		});
	} catch (error) {
		console.error("Chat room GET error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// DELETE: Decline or close a chat room
export async function DELETE(req: NextRequest, { params }: Params) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { roomId } = await params;

		const room = await db.chatRoom.findUnique({
			where: { id: roomId },
			include: { members: true, _count: { select: { members: true } } },
		});

		if (!room) {
			return NextResponse.json({ error: "Room not found" }, { status: 404 });
		}

		const isMember = room.members.some((m) => m.userId === session.userId);
		const isPending = room._count.members === 1;

		// Only initiator can cancel their own pending request,
		// or the notified target can decline
		if (!isMember && !isPending) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Mark the notification as read and delete the room
		await db.notification.updateMany({
			where: {
				type: "message",
				title: "Chat Request",
				message: { contains: `[roomId:${roomId}]` },
			},
			data: { isRead: true },
		});

		await db.chatRoom.delete({ where: { id: roomId } });

		return NextResponse.json({ message: "Chat request declined" });
	} catch (error) {
		console.error("Chat room DELETE error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
