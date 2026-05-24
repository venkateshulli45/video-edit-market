"use client";

import { ArrowLeft, CheckCircle, Clock, Send, X } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Message {
	id: string;
	text: string;
	fileUrl: string | null;
	fileName: string | null;
	createdAt: string;
	senderId: string;
	senderName: string;
	senderAvatar: string | null;
	isMe: boolean;
}

interface RoomInfo {
	id: string;
	isPending: boolean;
	iAmMember: boolean;
	otherUserId: string | null;
	otherName: string;
	otherAvatar: string | null;
	otherEmail: string | null;
	createdAt: string;
}

function Avatar({
	name,
	avatarUrl,
	size = "md",
}: {
	name: string;
	avatarUrl: string | null;
	size?: "sm" | "md" | "lg";
}) {
	const dim = size === "sm" ? 28 : size === "lg" ? 80 : 40;
	const cls =
		size === "sm"
			? "h-7 w-7 text-[10px]"
			: size === "lg"
				? "h-20 w-20 text-2xl"
				: "h-10 w-10 text-sm";

	if (avatarUrl) {
		return (
			<Image
				src={avatarUrl}
				alt={name}
				width={dim}
				height={dim}
				className={`${cls} rounded-full object-cover border-2 border-purple-500/30 shrink-0`}
			/>
		);
	}
	return (
		<div
			className={`${cls} rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shrink-0`}
		>
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

function formatTime(dateStr: string) {
	return new Date(dateStr).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	const today = new Date();
	if (d.toDateString() === today.toDateString()) return "Today";
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
	return d.toLocaleDateString();
}

export default function ChatRoomPage() {
	const params = useParams();
	const router = useRouter();
	const roomId = params.roomId as string;

	const [room, setRoom] = useState<RoomInfo | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [inputText, setInputText] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isAccepting, setIsAccepting] = useState(false);
	const [isDeclining, setIsDeclining] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const pollRef = useRef<NodeJS.Timeout | null>(null);
	const roomRef = useRef<RoomInfo | null>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const fetchRoom = useCallback(async () => {
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}`);
			const data = await res.json();
			if (!res.ok) {
				if (res.status === 403 || res.status === 404) {
					toast.error("Chat room not found or access denied");
					router.push("/dashboard/messages");
					return;
				}
				throw new Error(data.error);
			}
			setRoom(data.room);
			roomRef.current = data.room;
			setMessages(data.messages || []);
		} catch {
			toast.error("Failed to load chat");
		} finally {
			setIsLoading(false);
		}
	}, [roomId, router]);

	const pollMessages = useCallback(async () => {
		if (!roomRef.current || roomRef.current.isPending) return;
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
			const data = await res.json();
			if (res.ok) setMessages(data.messages || []);
		} catch {
			// silent fail on poll
		}
	}, [roomId]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!cancelled) await fetchRoom();
		})();
		return () => { cancelled = true; };
	}, [fetchRoom]);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	// Poll for new messages every 3s when chat is active
	useEffect(() => {
		pollRef.current = setInterval(pollMessages, 3000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [pollMessages]);

	const handleSend = async () => {
		const text = inputText.trim();
		if (!text || isSending) return;

		setIsSending(true);
		const optimistic: Message = {
			id: `temp-${Date.now()}`,
			text,
			fileUrl: null,
			fileName: null,
			createdAt: new Date().toISOString(),
			senderId: "me",
			senderName: "You",
			senderAvatar: null,
			isMe: true,
		};
		setMessages((prev) => [...prev, optimistic]);
		setInputText("");

		try {
			const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setMessages((prev) =>
				prev.map((m) => (m.id === optimistic.id ? data.message : m)),
			);
			scrollToBottom();
		} catch (err) {
			toast.error((err as Error).message || "Failed to send message");
			setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
			setInputText(text);
		} finally {
			setIsSending(false);
			inputRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleAccept = async () => {
		setIsAccepting(true);
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}/accept`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			toast.success("Chat accepted! You can now message.");
			fetchRoom();
		} catch (err) {
			toast.error((err as Error).message || "Failed to accept");
		} finally {
			setIsAccepting(false);
		}
	};

	const handleDecline = async () => {
		setIsDeclining(true);
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			toast.success("Chat request declined");
			router.push("/dashboard/messages");
		} catch (err) {
			toast.error((err as Error).message || "Failed to decline");
		} finally {
			setIsDeclining(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
			</div>
		);
	}

	if (!room) return null;

	const grouped: { date: string; msgs: Message[] }[] = [];
	for (const msg of messages) {
		const dateLabel = formatDate(msg.createdAt);
		const last = grouped[grouped.length - 1];
		if (last && last.date === dateLabel) {
			last.msgs.push(msg);
		} else {
			grouped.push({ date: dateLabel, msgs: [msg] });
		}
	}

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
			{/* Room Header */}
			<div className="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
				<button
					type="button"
					onClick={() => router.push("/dashboard/messages")}
					className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>

				<Avatar name={room.otherName} avatarUrl={room.otherAvatar} />

				<div className="flex-1">
					<p className="font-semibold text-slate-900 dark:text-slate-100">
						{room.otherName}
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{room.isPending ? (
							<span className="flex items-center space-x-1 text-yellow-500">
								<Clock className="h-3 w-3" />
								<span>Waiting for response</span>
							</span>
						) : (
							<span className="flex items-center space-x-1 text-green-500">
								<span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
								<span>Active chat</span>
							</span>
						)}
					</p>
				</div>
			</div>

			{/* ACCESS REQUEST GATE — target sees this */}
			{room.isPending && !room.iAmMember && (
				<div className="flex-1 flex items-center justify-center p-6">
					<div className="text-center max-w-sm">
						<div className="mx-auto mb-6">
							<Avatar
								name={room.otherName}
								avatarUrl={room.otherAvatar}
								size="lg"
							/>
						</div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
							Chat Request from {room.otherName}
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
							{room.otherEmail}
						</p>
						<p className="text-sm text-slate-600 dark:text-slate-300 mb-8">
							<strong>{room.otherName}</strong> wants to start a private
							conversation with you. Accept to open the chat, or decline to
							dismiss this request.
						</p>
						<div className="flex space-x-3 justify-center">
							<button
								type="button"
								onClick={handleAccept}
								disabled={isAccepting}
								className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-500/20"
							>
								<CheckCircle className="h-4 w-4" />
								<span>{isAccepting ? "Accepting..." : "Accept Chat"}</span>
							</button>
							<button
								type="button"
								onClick={handleDecline}
								disabled={isDeclining}
								className="flex items-center space-x-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-60 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
							>
								<X className="h-4 w-4" />
								<span>{isDeclining ? "Declining..." : "Decline"}</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* PENDING state for the initiator */}
			{room.isPending && room.iAmMember && (
				<div className="flex-1 flex items-center justify-center p-6">
					<div className="text-center max-w-sm">
						<div className="mx-auto mb-6 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 inline-block">
							<Clock className="h-10 w-10 text-yellow-500" />
						</div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
							Request Sent
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Your chat request has been sent to{" "}
							<strong className="text-slate-700 dark:text-slate-300">
								{room.otherName}
							</strong>
							. You can start chatting once they accept your request.
						</p>
					</div>
				</div>
			)}

			{/* ACTIVE CHAT */}
			{!room.isPending && (
				<>
					{/* Messages area */}
					<div className="flex-1 overflow-y-auto space-y-1 pr-1 mb-4 scroll-smooth">
						{messages.length === 0 && (
							<div className="flex flex-col items-center justify-center h-full py-16 text-center">
								<div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
									<Send className="h-8 w-8 text-slate-400" />
								</div>
								<p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
									No messages yet
								</p>
								<p className="text-xs text-slate-400 mt-1">
									Say hello to {room.otherName}!
								</p>
							</div>
						)}

						{grouped.map((group) => (
							<div key={group.date}>
								<div className="flex items-center my-4">
									<div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
									<span className="px-3 text-[11px] text-slate-400 font-medium">
										{group.date}
									</span>
									<div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
								</div>

								{group.msgs.map((msg, i) => {
									const prevMsg = group.msgs[i - 1];
									const showAvatar =
										!msg.isMe && (i === 0 || prevMsg?.isMe);
									return (
										<div
											key={msg.id}
											className={`flex items-end space-x-2 mb-1 ${msg.isMe ? "flex-row-reverse space-x-reverse" : ""}`}
										>
											<div className="w-7 shrink-0">
												{showAvatar && (
													<Avatar
														name={msg.senderName}
														avatarUrl={msg.senderAvatar}
														size="sm"
													/>
												)}
											</div>

											<div
												className={`max-w-[72%] group ${msg.isMe ? "items-end" : "items-start"} flex flex-col`}
											>
												{showAvatar && !msg.isMe && (
													<span className="text-[11px] text-slate-400 mb-1 ml-1">
														{msg.senderName}
													</span>
												)}
												<div
													className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
														msg.isMe
															? "bg-purple-600 text-white rounded-br-sm"
															: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm"
													} ${msg.id.startsWith("temp-") ? "opacity-70" : ""}`}
												>
													{msg.text}
												</div>
												<span className="text-[10px] text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity px-1">
													{formatTime(msg.createdAt)}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Bar */}
					<div className="shrink-0 flex items-end space-x-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
						<textarea
							ref={inputRef}
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							onKeyDown={handleKeyDown}
							rows={1}
							placeholder={`Message ${room.otherName}...`}
							className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 max-h-32 leading-relaxed py-1"
							style={{ scrollbarWidth: "none" }}
						/>
						<button
							type="button"
							onClick={handleSend}
							disabled={!inputText.trim() || isSending}
							className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0 shadow-md hover:shadow-purple-500/30"
						>
							<Send className="h-4 w-4" />
						</button>
					</div>
					<p className="text-[10px] text-slate-400 text-center mt-1.5">
						Press Enter to send · Shift+Enter for new line
					</p>
				</>
			)}
		</div>
	);
}
