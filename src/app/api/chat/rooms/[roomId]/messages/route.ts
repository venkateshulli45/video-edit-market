import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { db } from "@/lib/db";

type Params = { params: Promise<{ roomId: string }> };

// GET: Fetch messages for an active chat room
export async function GET(req: NextRequest, { params }: Params) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { roomId } = await params;

		// Verify membership
		const membership = await db.chatMember.findFirst({
			where: { roomId, userId: session.userId },
		});

		if (!membership) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const messages = await db.message.findMany({
			where: { roomId },
			orderBy: { createdAt: "asc" },
			include: {
				sender: {
					select: {
						id: true,
						email: true,
						clientProfile: { select: { fullName: true, avatarUrl: true } },
						providerProfile: { select: { fullName: true, avatarUrl: true } },
					},
				},
			},
		});

		const formatted = messages.map((msg) => ({
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

		return NextResponse.json({ messages: formatted });
	} catch (error) {
		console.error("Messages GET error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// POST: Send a message in an active chat room
export async function POST(req: NextRequest, { params }: Params) {
	try {
		const session = await getSession(req);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { roomId } = await params;

		// Verify membership
		const membership = await db.chatMember.findFirst({
			where: { roomId, userId: session.userId },
		});

		if (!membership) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Verify room is active (2 members)
		const memberCount = await db.chatMember.count({ where: { roomId } });
		if (memberCount < 2) {
			return NextResponse.json(
				{
					error:
						"Chat is not yet active. Wait for the other party to accept your request.",
				},
				{ status: 400 },
			);
		}

		const body = await req.json();
		const { text } = body;

		if (!text || typeof text !== "string" || text.trim().length === 0) {
			return NextResponse.json(
				{ error: "Message text is required" },
				{ status: 400 },
			);
		}

		const message = await db.message.create({
			data: {
				roomId,
				senderId: session.userId,
				messageText: text.trim(),
			},
			include: {
				sender: {
					select: {
						id: true,
						email: true,
						clientProfile: { select: { fullName: true, avatarUrl: true } },
						providerProfile: { select: { fullName: true, avatarUrl: true } },
					},
				},
			},
		});

		return NextResponse.json({
			message: {
				id: message.id,
				text: message.messageText,
				createdAt: message.createdAt,
				senderId: message.senderId,
				senderName:
					message.sender.clientProfile?.fullName ||
					message.sender.providerProfile?.fullName ||
					message.sender.email,
				senderAvatar:
					message.sender.clientProfile?.avatarUrl ||
					message.sender.providerProfile?.avatarUrl ||
					null,
				isMe: true,
			},
		});
	} catch (error) {
		console.error("Messages POST error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
