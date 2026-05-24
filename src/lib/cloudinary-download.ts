/**
 * Cloudinary delivery flag to suggest download (no custom filename — dots in names break URLs).
 */
export function buildCloudinaryAttachmentUrl(fileUrl: string): string {
	try {
		const url = new URL(fileUrl);
		if (!url.hostname.includes("res.cloudinary.com")) {
			return fileUrl;
		}

		const pathParts = url.pathname.split("/").filter(Boolean);
		const uploadIndex = pathParts.indexOf("upload");
		if (uploadIndex === -1) {
			return fileUrl;
		}

		if (pathParts[uploadIndex + 1]?.startsWith("fl_attachment")) {
			return fileUrl;
		}

		pathParts.splice(uploadIndex + 1, 0, "fl_attachment");
		url.pathname = `/${pathParts.join("/")}`;
		return url.toString();
	} catch {
		return fileUrl;
	}
}

export function safeDownloadFilename(name: string): string {
	const cleaned = name.replace(/[/\\?%*:|"<>]/g, "_").trim();
	return cleaned.slice(0, 200) || "download";
}
