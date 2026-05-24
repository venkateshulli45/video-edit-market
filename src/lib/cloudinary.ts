import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const WORK_UPLOAD_FOLDER = "video-edit-market/work";

export function isCloudinaryConfigured(): boolean {
	return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinaryConfig() {
	if (!isCloudinaryConfigured()) {
		throw new Error("Cloudinary is not configured");
	}

	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	});

	return { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };
}

export function createUploadSignature() {
	const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
	const timestamp = Math.round(Date.now() / 1000);
	const params = {
		timestamp,
		folder: WORK_UPLOAD_FOLDER,
	};

	const signature = cloudinary.utils.api_sign_request(params, apiSecret);

	return {
		cloudName,
		apiKey,
		timestamp,
		signature,
		folder: WORK_UPLOAD_FOLDER,
	};
}
