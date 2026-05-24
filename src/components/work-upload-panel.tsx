"use client";

import {
	Check,
	Download,
	ExternalLink,
	ImagePlus,
	Loader2,
	Upload,
	Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mediaTypeFromResourceType } from "@/lib/media-utils";

export interface WorkUpload {
	id: string;
	jobId: string;
	contractId: string;
	mediaType: "image" | "video";
	fileUrl: string;
	fileName: string | null;
	fileSize: number | null;
	note: string | null;
	createdAt: string;
	providerName?: string;
}

interface WorkUploadPanelProps {
	jobId: string;
	canUpload?: boolean;
	canAcceptProgress?: boolean;
	canDownload?: boolean;
	jobStatus?: string;
	onProgressAccepted?: () => void;
	title?: string;
}

export function WorkUploadPanel({
	jobId,
	canUpload = false,
	canAcceptProgress = false,
	canDownload = true,
	jobStatus,
	onProgressAccepted,
	title = "Work updates",
}: WorkUploadPanelProps) {
	const [uploads, setUploads] = useState<WorkUpload[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [isAccepting, setIsAccepting] = useState(false);
	const [note, setNote] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isJobComplete = jobStatus === "completed";

	const loadUploads = useCallback(async () => {
		try {
			const res = await fetch(`/api/jobs/${jobId}/work-uploads`);
			const data = await res.json();
			if (res.ok) {
				setUploads(data.uploads || []);
			} else if (res.status !== 403) {
				toast.error(data.error || "Failed to load work updates");
			}
		} catch {
			toast.error("Failed to load work updates");
		} finally {
			setIsLoading(false);
		}
	}, [jobId]);

	useEffect(() => {
		loadUploads();
	}, [loadUploads]);

	const uploadToCloudinary = async (file: File) => {
		const signRes = await fetch("/api/cloudinary/sign");
		const signData = await signRes.json();
		if (!signRes.ok) {
			throw new Error(signData.error || "Could not get upload signature");
		}

		const formData = new FormData();
		formData.append("file", file);
		formData.append("api_key", signData.apiKey);
		formData.append("timestamp", String(signData.timestamp));
		formData.append("signature", signData.signature);
		formData.append("folder", signData.folder);

		const cloudRes = await fetch(
			`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`,
			{ method: "POST", body: formData },
		);
		const cloudData = await cloudRes.json();
		if (!cloudRes.ok) {
			throw new Error(cloudData.error?.message || "Cloudinary upload failed");
		}

		return cloudData;
	};

	const handleFiles = async (files: FileList | null) => {
		if (!files?.length || !canUpload) return;

		setIsUploading(true);
		try {
			for (const file of Array.from(files)) {
				const isImage = file.type.startsWith("image/");
				const isVideo = file.type.startsWith("video/");
				if (!isImage && !isVideo) {
					toast.error(`${file.name}: only images and videos are allowed`);
					continue;
				}

				const cloudData = await uploadToCloudinary(file);
				const mediaType = mediaTypeFromResourceType(
					cloudData.resource_type || (isVideo ? "video" : "image"),
				);

				const saveRes = await fetch(`/api/jobs/${jobId}/work-uploads`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fileUrl: cloudData.secure_url,
						fileName: file.name,
						fileSize: file.size,
						mediaType,
						note: note.trim() || undefined,
					}),
				});
				const saveData = await saveRes.json();
				if (!saveRes.ok) {
					throw new Error(saveData.error || "Failed to save upload");
				}
			}

			toast.success("Upload(s) saved — client can see them on the job post");
			setNote("");
			if (fileInputRef.current) fileInputRef.current.value = "";
			await loadUploads();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const handleAcceptProgress = async () => {
		setIsAccepting(true);
		try {
			const res = await fetch(`/api/jobs/${jobId}/accept-progress`, {
				method: "PATCH",
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || "Progress accepted — job complete!");
				onProgressAccepted?.();
			} else {
				toast.error(data.error || "Could not accept progress");
			}
		} catch {
			toast.error("Failed to accept progress");
		} finally {
			setIsAccepting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
					{title}
				</h3>
				{canAcceptProgress && isJobComplete && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600 dark:text-green-400">
						<Check className="h-3.5 w-3.5" />
						Progress accepted
					</span>
				)}
				{canAcceptProgress && !isJobComplete && (
					<Button
						type="button"
						disabled={isAccepting || isLoading || uploads.length === 0}
						onClick={handleAcceptProgress}
						className="bg-green-600 hover:bg-green-500 text-white font-bold gap-2 shrink-0"
					>
						{isAccepting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Check className="h-4 w-4" />
						)}
						{isAccepting ? "Accepting…" : "Accept progress"}
					</Button>
				)}
			</div>
			{canAcceptProgress && !isJobComplete && uploads.length === 0 && !isLoading && (
				<p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
					Accept progress becomes available once your editor uploads work for
					you to review.
				</p>
			)}

			{canUpload && (
				<Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5 space-y-4">
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Upload preview images or video cuts. Files go to Cloudinary and appear
						on this job for the client.
					</p>
					<div className="space-y-2">
						<Label htmlFor="work-note" className="text-xs font-semibold">
							Optional note for this batch
						</Label>
						<Input
							id="work-note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="e.g. Rough cut v1 — feedback welcome"
							className="bg-white dark:bg-slate-900"
							disabled={isUploading}
						/>
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*,video/*"
						multiple
						className="hidden"
						onChange={(e) => handleFiles(e.target.files)}
					/>
					<Button
						type="button"
						disabled={isUploading}
						onClick={() => fileInputRef.current?.click()}
						className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2"
					>
						{isUploading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Upload className="h-4 w-4" />
						)}
						{isUploading ? "Uploading…" : "Choose images or videos"}
					</Button>
				</Card>
			)}

			{isLoading ? (
				<p className="text-sm text-slate-500 py-4">Loading work updates…</p>
			) : uploads.length === 0 ? (
				<p className="text-sm text-slate-500 dark:text-slate-400 py-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center">
					{canUpload
						? "No uploads yet. Add images or videos for the client to review."
						: "No work updates from the editor yet."}
				</p>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{uploads.map((item) => (
						<Card
							key={item.id}
							className="border-slate-200 dark:border-slate-800 overflow-hidden"
						>
							<div className="aspect-video bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center">
								{item.mediaType === "video" ? (
									// biome-ignore lint/a11y/useMediaCaption: editor preview clips
									<video
										src={item.fileUrl}
										controls
										className="w-full h-full object-contain"
										preload="metadata"
									/>
								) : (
									// biome-ignore lint/performance/noImgElement: external Cloudinary URLs
									<img
										src={item.fileUrl}
										alt={item.fileName || "Work upload"}
										className="w-full h-full object-contain"
									/>
								)}
								<span className="absolute top-2 left-2 px-2 py-0.5 rounded text-2xs font-bold bg-black/60 text-white flex items-center gap-1">
									{item.mediaType === "video" ? (
										<Video className="h-3 w-3" />
									) : (
										<ImagePlus className="h-3 w-3" />
									)}
									{item.mediaType}
								</span>
							</div>
							<div className="p-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
								{item.fileName && (
									<p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
										{item.fileName}
									</p>
								)}
								{item.note && (
									<p className="italic text-slate-600 dark:text-slate-400">
										{item.note}
									</p>
								)}
								<p>
									{item.providerName && (
										<span className="font-medium">{item.providerName} · </span>
									)}
									{new Date(item.createdAt).toLocaleString()}
								</p>
								{canDownload && (
									<div className="flex flex-wrap gap-2 pt-1">
										<a
											href={`/api/jobs/${jobId}/work-uploads/${item.id}/download`}
											download={item.fileName || true}
											className={cn(
												buttonVariants({ variant: "outline", size: "sm" }),
												"h-8 gap-1.5 text-xs font-semibold",
											)}
										>
											<Download className="h-3.5 w-3.5" />
											Download
										</a>
										<a
											href={item.fileUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={cn(
												buttonVariants({ variant: "ghost", size: "sm" }),
												"h-8 gap-1.5 text-xs",
											)}
										>
											<ExternalLink className="h-3.5 w-3.5" />
											Open
										</a>
									</div>
								)}
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
