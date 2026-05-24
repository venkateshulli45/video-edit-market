export function mediaTypeFromResourceType(
	resourceType: string,
): "image" | "video" {
	return resourceType === "video" ? "video" : "image";
}
