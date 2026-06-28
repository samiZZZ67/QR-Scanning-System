import { createHash } from 'node:crypto';
import config from '../config/env.js';

const MAX_INLINE_IMAGE_BYTES = Number(process.env.MAX_INLINE_IMAGE_BYTES || 4 * 1024 * 1024);
const ALLOWED_DATA_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

function getCloudinaryConfig() {
  // CLOUDINARY_URL takes precedence and encodes all three credentials
  if (process.env.CLOUDINARY_URL) {
    try {
      const parsed = new URL(process.env.CLOUDINARY_URL);
      return {
        cloudName: parsed.hostname,
        apiKey: parsed.username,
        apiSecret: parsed.password
      };
    } catch {
      // fall through to env vars
    }
  }
  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    apiSecret: config.cloudinary.apiSecret
  };
}

function signCloudinaryParams(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

function transformedCloudinaryUrl(url, transformation) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transformation}/`);
}

function ensureImageInput(input = {}) {
  const file = input.dataUrl || input.sourceUrl || input.url;
  if (!file || typeof file !== 'string') {
    throw new Error('Image file or image URL is required');
  }
  if (input.dataUrl) {
    const match = input.dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
    if (!match || !ALLOWED_DATA_IMAGE_TYPES.has(match[1].toLowerCase())) {
      throw new Error('Only JPEG, PNG, WebP, and GIF image uploads are supported');
    }
    const bytes = Math.floor((match[2].replace(/\s/g, '').length * 3) / 4);
    if (bytes > MAX_INLINE_IMAGE_BYTES) {
      throw new Error('Image is too large. Please upload an image under 4 MB.');
    }
    return file;
  }
  if (input.sourceUrl || input.url) {
    try {
      const parsed = new URL(file);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP or HTTPS image URLs are supported');
      }
    } catch {
      throw new Error('A valid image URL is required');
    }
  }
  return file;
}

export async function uploadImage(input = {}) {
  const file = ensureImageInput(input);
  const folder = input.folder || config.cloudinary.folder || 'qr-menu';
  const cld = getCloudinaryConfig();

  // No Cloudinary credentials → return the raw URL/base64 as-is
  if (!cld.cloudName || !cld.apiKey || !cld.apiSecret) {
    return {
      url: file,
      thumbnail: file,
      publicId: '',
      storage: 'inline-dev'
    };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = signCloudinaryParams(paramsToSign, cld.apiSecret);

  const form = new FormData();
  form.set('file', file);
  form.set('api_key', cld.apiKey);
  form.set('timestamp', String(timestamp));
  form.set('folder', folder);
  form.set('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cld.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed');
  }

  const optimized = transformedCloudinaryUrl(payload.secure_url, 'f_auto,q_auto');
  return {
    url: optimized,
    thumbnail: transformedCloudinaryUrl(
      payload.secure_url,
      'c_fill,w_480,h_320,f_auto,q_auto'
    ),
    publicId: payload.public_id,
    storage: 'cloudinary'
  };
}
