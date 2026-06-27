import { createHash } from "node:crypto";

function cloudinaryConfig() {
  if (process.env.CLOUDINARY_URL) {
    const parsed = new URL(process.env.CLOUDINARY_URL);
    return {
      cloudName: parsed.hostname,
      apiKey: parsed.username,
      apiSecret: parsed.password
    };
  }

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  };
}

function signCloudinaryParams(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function transformedCloudinaryUrl(url, transformation) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transformation}/`);
}

function ensureImageInput(input = {}) {
  const file = input.dataUrl || input.sourceUrl || input.url;
  if (!file || typeof file !== "string") {
    throw new Error("Image file or image URL is required");
  }
  if (input.dataUrl && !input.dataUrl.startsWith("data:image/")) {
    throw new Error("Only image uploads are supported");
  }
  return file;
}

export async function uploadImage(input = {}) {
  const file = ensureImageInput(input);
  const folder = input.folder || process.env.CLOUDINARY_FOLDER || "qr-menu";
  const config = cloudinaryConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    return {
      url: file,
      thumbnail: file,
      publicId: "",
      storage: "inline-dev"
    };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    folder,
    timestamp
  };
  const signature = signCloudinaryParams(paramsToSign, config.apiSecret);

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", config.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Cloudinary upload failed");
  }

  const optimized = transformedCloudinaryUrl(payload.secure_url, "f_auto,q_auto");
  return {
    url: optimized,
    thumbnail: transformedCloudinaryUrl(payload.secure_url, "c_fill,w_480,h_320,f_auto,q_auto"),
    publicId: payload.public_id,
    storage: "cloudinary"
  };
}
