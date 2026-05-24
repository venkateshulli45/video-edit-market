"use client";

import {
	CheckCircle,
	Clock,
	MessageSquare,
	X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ChatRoom {
	id: string;
	isPending: boolean;
	iAmInitiator: boolean;
	otherUserId: string | null;
	otherName: string;
	otherAvatar: string | null;
	otherEmail: string | null;
	lastMessage: string | null;
	lastMessageAt: string;
	createdAt: string;
	notifId?: string;
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
	const sz =
		size === "sm"
			? "h-8 w-8 text-xs"
			: size === "lg"
				? "h-14 w-14 text-lg"
				: "h-10 w-10 text-sm";
	if (avatarUrl) {
		return (
			<Image
				src={avatarUrl}
				alt={name}
				width={size === "lg" ? 56 : size === "sm" ? 32 : 40}
				height={size === "lg" ? 56 : size === "sm" ? 32 : 40}
				className={`${sz} rounded-full object-cover border-2 border-purple-500/30 shrink-0`}
			/>
		);
	}
	return (
		<div
			className={`${sz} rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shrink-0`}
		>
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

function TimeAgo({ date }: { date: string }) {
	// useState initializer runs once on mount — avoids calling Date.now() during render
	const [now] = useState(() => Date.now());
	const diff = now - new Date(date).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return <span>just now</span>;
	if (mins < 60) return <span>{mins}m ago</span>;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return <span>{hrs}h ago</span>;
	return <span>{new Date(date).toLocaleDateString()}</span>;
}

export default function MessagesPage() {
	const router = useRouter();
	const [rooms, setRooms] = useState<ChatRoom[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"chats" | "requests">("chats");

	const fetchRooms = useCallback(async () => {
		try {
			const res = await fetch("/api/chat/rooms");
			const data = await res.json();
			if (res.ok) setRooms(data.rooms || []);
		} catch {
			toast.error("Failed to load messages");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!cancelled) await fetchRooms();
		})();
		return () => { cancelled = true; };
	}, [fetchRooms]);

	const activeChats = rooms.filter((r) => !r.isPending || r.iAmInitiator);
	const incomingRequests = rooms.filter((r) => r.isPending && !r.iAmInitiator);

	const handleAccept = async (roomId: string) => {
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}/accept`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			toast.success("Chat request accepted!");
			fetchRooms();
			router.push(`/dashboard/messages/${roomId}`);
		} catch (err) {
			toast.error((err as Error).message || "Failed to accept request");
		}
	};

	const handleDecline = async (roomId: string) => {
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			toast.success("Chat request declined");
			fetchRooms();
		} catch (err) {
			toast.error((err as Error).message || "Failed to decline request");
		}
	};

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center space-x-3 mb-8">
				<div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
					<MessageSquare className="h-6 w-6" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
						Messages
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Chat with clients and editors
					</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
				<button
					type="button"
					onClick={() => setActiveTab("chats")}
					className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
						activeTab === "chats"
							? "border-purple-500 text-purple-500"
							: "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
					}`}
				>
					<div className="flex items-center space-x-2">
						<MessageSquare className="h-4 w-4" />
						<span>Chats ({activeChats.length})</span>
					</div>
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("requests")}
					className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
						activeTab === "requests"
							? "border-purple-500 text-purple-500"
							: "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
					}`}
				>
					<div className="flex items-center space-x-2">
						<Clock className="h-4 w-4" />
						<span>Requests</span>
						{incomingRequests.length > 0 && (
							<span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
								{incomingRequests.length}
							</span>
						)}
					</div>
				</button>
			</div>

			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-24 text-slate-400">
					<div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
					<p className="text-sm">Loading conversations...</p>
				</div>
			) : activeTab === "chats" ? (
				activeChats.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
							<MessageSquare className="h-10 w-10 text-slate-400" />
						</div>
						<h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
							No conversations yet
						</h3>
						<p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
							Send a chat request to a client or editor from their profile to
							start messaging.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{activeChats.map((room) => (
							<button
								key={room.id}
								type="button"
								onClick={() => router.push(`/dashboard/messages/${room.id}`)}
								className="w-full flex items-center space-x-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
							>
								<div className="relative">
									<Avatar name={room.otherName} avatarUrl={room.otherAvatar} />
									{room.isPending && (
										<span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-yellow-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
											<Clock className="h-2 w-2 text-yellow-900" />
										</span>
									)}
									{!room.isPending && (
										<span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-white dark:border-slate-900" />
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-0.5">
										<span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
											{room.otherName}
										</span>
										<span className="text-[11px] text-slate-400 shrink-0 ml-2">
											<TimeAgo date={room.lastMessageAt} />
										</span>
									</div>
									<p className="text-xs text-slate-500 dark:text-slate-400 truncate">
										{room.isPending && room.iAmInitiator
											? "⏳ Awaiting their response..."
											: (room.lastMessage ?? "Start the conversation")}
									</p>
								</div>

								{room.isPending && room.iAmInitiator && (
									<span className="text-[10px] font-semibold px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded-full shrink-0">
										Pending
									</span>
								)}
							</button>
						))}
					</div>
				)
			) : incomingRequests.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
						<CheckCircle className="h-10 w-10 text-green-400" />
					</div>
					<h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
						All clear!
					</h3>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						No pending chat requests at this time.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{incomingRequests.map((room) => (
						<div
							key={room.id}
							className="flex items-center space-x-4 p-5 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5"
						>
							<Avatar
								name={room.otherName}
								avatarUrl={room.otherAvatar}
								size="lg"
							/>

							<div className="flex-1 min-w-0">
								<p className="font-semibold text-slate-900 dark:text-slate-100">
									{room.otherName}
								</p>
								<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
									{room.otherEmail}
								</p>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									wants to start a conversation with you.
								</p>
								<p className="text-[11px] text-slate-400 mt-1">
									<TimeAgo date={room.createdAt} />
								</p>
							</div>

							<div className="flex flex-col space-y-2 shrink-0">
								<button
									type="button"
									onClick={() => handleAccept(room.id)}
									className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
								>
									<CheckCircle className="h-3.5 w-3.5" />
									<span>Accept</span>
								</button>
								<button
									type="button"
									onClick={() => handleDecline(room.id)}
									className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
								>
									<X className="h-3.5 w-3.5" />
									<span>Decline</span>
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
