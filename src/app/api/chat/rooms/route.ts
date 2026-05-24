import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// GET: List all chat rooms for the current user
export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Rooms where user IS a member (active or pending as initiator)
		const myRooms = await db.chatRoom.findMany({
			where: {
				members: { some: { userId: session.userId } },
			},
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
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const formattedMyRooms = myRooms.map((room) => {
			const memberCount = room.members.length;
			const isPending = memberCount === 1;
			const iAmInitiator = isPending;
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

			return {
				id: room.id,
				isPending,
				iAmInitiator,
				otherUserId: otherUser?.id ?? null,
				otherName,
				otherAvatar,
				otherEmail: otherUser?.email ?? null,
				lastMessage: room.messages[0]?.messageText ?? null,
				lastMessageAt: room.messages[0]?.createdAt ?? room.createdAt,
				createdAt: room.createdAt,
			};
		});

		// Incoming pending requests: find via notifications sent to this user
		const incomingNotifications = await db.notification.findMany({
			where: {
				userId: session.userId,
				type: "message",
				title: "Chat Request",
				isRead: false,
			},
			orderBy: { createdAt: "desc" },
		});

		const incomingRoomIds = incomingNotifications
			.map((n) => {
				const match = n.message.match(/\[roomId:([^\]]+)\]/);
				return match ? { roomId: match[1], notifId: n.id } : null;
			})
			.filter(Boolean) as { roomId: string; notifId: string }[];

		const pendingIncomingRooms = await Promise.all(
			incomingRoomIds.map(async ({ roomId, notifId }) => {
				const room = await db.chatRoom.findUnique({
					where: { id: roomId },
					include: {
						members: {
							include: {
								user: {
									select: {
										id: true,
										email: true,
										clientProfile: {
											select: { fullName: true, avatarUrl: true },
										},
										providerProfile: {
											select: { fullName: true, avatarUrl: true },
										},
									},
								},
							},
						},
					},
				});
				if (!room || room.members.length !== 1) return null;

				const initiator = room.members[0]?.user;
				const initiatorName =
					initiator?.clientProfile?.fullName ||
					initiator?.providerProfile?.fullName ||
					initiator?.email ||
					"Someone";
				const initiatorAvatar =
					initiator?.clientProfile?.avatarUrl ||
					initiator?.providerProfile?.avatarUrl ||
					null;

				return {
					id: room.id,
					isPending: true,
					iAmInitiator: false,
					otherUserId: initiator?.id ?? null,
					otherName: initiatorName,
					otherAvatar: initiatorAvatar,
					otherEmail: initiator?.email ?? null,
					lastMessage: null,
					lastMessageAt: room.createdAt,
					createdAt: room.createdAt,
					notifId,
				};
			}),
		);

		const validIncoming = pendingIncomingRooms.filter(Boolean);
		const allRooms = [...formattedMyRooms, ...validIncoming];

		return NextResponse.json({ rooms: allRooms });
	} catch (error) {
		console.error("Chat rooms GET error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// POST: Initiate a chat request with another user
export async function POST(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { targetUserId } = body;

		if (!targetUserId) {
			return NextResponse.json(
				{ error: "targetUserId is required" },
				{ status: 400 },
			);
		}

		if (targetUserId === session.userId) {
			return NextResponse.json(
				{ error: "Cannot send a chat request to yourself" },
				{ status: 400 },
			);
		}

		// Check target user exists
		const target = await db.user.findUnique({
			where: { id: targetUserId },
			select: {
				id: true,
				email: true,
				clientProfile: { select: { fullName: true } },
				providerProfile: { select: { fullName: true } },
			},
		});

		if (!target) {
			return NextResponse.json(
				{ error: "Target user not found" },
				{ status: 404 },
			);
		}

		// Active chat already exists between these two users
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
				message: "Chat room already exists",
				roomId: activeRoom.id,
				alreadyExists: true,
				status: "active",
			});
		}

		// Pending outgoing request already sent to this user — do not create another
		const myPendingRooms = await db.chatRoom.findMany({
			where: {
				members: { some: { userId: session.userId } },
			},
			include: { _count: { select: { members: true } } },
		});

		for (const room of myPendingRooms) {
			if (room._count.members !== 1) continue;
			const pendingNotif = await db.notification.findFirst({
				where: {
					userId: targetUserId,
					type: "message",
					title: "Chat Request",
					message: { contains: `[roomId:${room.id}]` },
				},
			});
			if (pendingNotif) {
				return NextResponse.json({
					message: "Chat request already sent",
					roomId: room.id,
					alreadyPending: true,
					status: "pending_outgoing",
				});
			}
		}

		// Get current user's display name
		const me = await db.user.findUnique({
			where: { id: session.userId },
			select: {
				clientProfile: { select: { fullName: true } },
				providerProfile: { select: { fullName: true } },
				email: true,
			},
		});
		const myName =
			me?.clientProfile?.fullName ||
			me?.providerProfile?.fullName ||
			me?.email ||
			"Someone";
		const targetName =
			target.clientProfile?.fullName ||
			target.providerProfile?.fullName ||
			target.email ||
			"Someone";

		// Create chat room with initiator as the only member (pending state)
		const room = await db.chatRoom.create({
			data: {
				members: {
					create: { userId: session.userId },
				},
			},
		});

		// Send notification to target user with the roomId embedded
		await db.notification.create({
			data: {
				userId: targetUserId,
				title: "Chat Request",
				message: `${myName} wants to start a conversation with you. [roomId:${room.id}]`,
				type: "message",
				isRead: false,
			},
		});

		return NextResponse.json({
			message: `Chat request sent to ${targetName}`,
			roomId: room.id,
		});
	} catch (error) {
		console.error("Chat rooms POST error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
