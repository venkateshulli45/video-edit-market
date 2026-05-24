export type ChatRequestStatus =
	| "none"
	| "pending_outgoing"
	| "pending_incoming"
	| "active";

export interface ChatStatusResult {
	status: ChatRequestStatus;
	roomId?: string;
}

export interface StartChatResult {
	roomId: string;
	alreadyExists: boolean;
	alreadyPending?: boolean;
	status?: ChatRequestStatus;
	message: string;
}

export async function fetchChatStatus(
	targetUserId: string,
): Promise<ChatStatusResult> {
	const res = await fetch(
		`/api/chat/status?targetUserId=${encodeURIComponent(targetUserId)}`,
	);
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.error || "Failed to load chat status");
	}
	return {
		status: data.status as ChatRequestStatus,
		roomId: data.roomId,
	};
}

/** POST /api/chat/rooms — create a chat request with another user. */
export async function startChatRequest(
	targetUserId: string,
): Promise<StartChatResult> {
	const res = await fetch("/api/chat/rooms", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ targetUserId }),
	});
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.error || "Failed to send chat request");
	}
	if (!data.roomId) {
		throw new Error("Invalid response from server");
	}
	return {
		roomId: data.roomId,
		alreadyExists: Boolean(data.alreadyExists),
		alreadyPending: Boolean(data.alreadyPending),
		status: data.status,
		message: data.message || "Chat request sent",
	};
}

/** DELETE /api/chat/rooms/[roomId] — cancel a pending outgoing request. */
export async function cancelChatRequest(roomId: string): Promise<void> {
	const res = await fetch(`/api/chat/rooms/${roomId}`, {
		method: "DELETE",
	});
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.error || "Failed to cancel chat request");
	}
}
