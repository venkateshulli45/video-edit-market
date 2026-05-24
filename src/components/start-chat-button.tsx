"use client";

import { MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	type ChatRequestStatus,
	cancelChatRequest,
	fetchChatStatus,
	startChatRequest,
} from "@/lib/start-chat";
import { cn } from "@/lib/utils";

type StartChatButtonProps = {
	targetUserId: string;
	targetName?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	className?: string;
	showIcon?: boolean;
};

export function StartChatButton({
	targetUserId,
	targetName,
	variant = "outline",
	size = "sm",
	className,
	showIcon = true,
}: StartChatButtonProps) {
	const router = useRouter();
	const [status, setStatus] = useState<ChatRequestStatus>("none");
	const [roomId, setRoomId] = useState<string | null>(null);
	const [isLoadingStatus, setIsLoadingStatus] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);

	const loadStatus = useCallback(async () => {
		try {
			const result = await fetchChatStatus(targetUserId);
			setStatus(result.status);
			setRoomId(result.roomId ?? null);
		} catch {
			setStatus("none");
			setRoomId(null);
		} finally {
			setIsLoadingStatus(false);
		}
	}, [targetUserId]);

	useEffect(() => {
		setIsLoadingStatus(true);
		loadStatus();
	}, [loadStatus]);

	const handleRequest = async () => {
		setIsSending(true);
		try {
			const result = await startChatRequest(targetUserId);
			if (result.alreadyExists || result.status === "active") {
				toast.success(
					targetName
						? `Opening chat with ${targetName}`
						: "Opening conversation",
				);
				router.push(`/dashboard/messages/${result.roomId}`);
				return;
			}
			if (result.alreadyPending || result.status === "pending_outgoing") {
				setStatus("pending_outgoing");
				setRoomId(result.roomId);
				toast.info("Request already sent");
				return;
			}
			setStatus("pending_outgoing");
			setRoomId(result.roomId);
			toast.success(
				targetName ? `Request sent to ${targetName}` : result.message,
			);
		} catch (err) {
			toast.error((err as Error).message || "Failed to send request");
		} finally {
			setIsSending(false);
		}
	};

	const handleCancel = async () => {
		if (!roomId) return;
		setIsCancelling(true);
		try {
			await cancelChatRequest(roomId);
			setStatus("none");
			setRoomId(null);
			toast.success("Request cancelled");
		} catch (err) {
			toast.error((err as Error).message || "Failed to cancel request");
		} finally {
			setIsCancelling(false);
		}
	};

	const handleOpenChat = () => {
		if (roomId) {
			router.push(`/dashboard/messages/${roomId}`);
		}
	};

	if (isLoadingStatus) {
		return (
			<Button
				type="button"
				variant={variant}
				size={size}
				disabled
				className={cn("font-semibold", className)}
			>
				...
			</Button>
		);
	}

	if (status === "active") {
		return (
			<Button
				type="button"
				variant={variant}
				size={size}
				onClick={handleOpenChat}
				className={cn("font-semibold", className)}
			>
				{showIcon && <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
				Open Chat
			</Button>
		);
	}

	if (status === "pending_incoming") {
		return (
			<Button
				type="button"
				variant={variant}
				size={size}
				onClick={handleOpenChat}
				className={cn(
					"font-semibold border-purple-500/40 text-purple-600 dark:text-purple-400",
					className,
				)}
			>
				{showIcon && <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
				Respond to Request
			</Button>
		);
	}

	if (status === "pending_outgoing") {
		return (
			<div className={cn("flex items-center gap-2 shrink-0", className)}>
				<span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25">
					Request Sent
				</span>
				<Button
					type="button"
					variant="outline"
					size={size}
					disabled={isCancelling}
					onClick={handleCancel}
					className="font-semibold text-red-500 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30"
				>
					<X className="h-3.5 w-3.5 mr-1" />
					{isCancelling ? "Cancelling..." : "Cancel"}
				</Button>
			</div>
		);
	}

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			disabled={isSending}
			onClick={handleRequest}
			className={cn("font-semibold", className)}
		>
			{showIcon && <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
			{isSending ? "Sending..." : "Request"}
		</Button>
	);
}
