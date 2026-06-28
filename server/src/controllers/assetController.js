import { asyncHandler } from '../middlewares/asyncHandler.js';
import { uploadImage } from '../services/uploads.js';

/**
 * GET /api/assets  (public)
 * Returns all configurable app assets (landing hero, menu banner, etc.).
 */
export const listAssets = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.listAssets());
});

/**
 * PATCH /api/assets/:key  (staff)
 * Updates an asset URL / thumbnail and broadcasts the change.
 */
export const updateAsset = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const asset = await repository.updateAsset(req.params.key, req.body);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  if (io) io.emit('assets.changed', await repository.listAssets());
  return res.json(asset);
});

/**
 * POST /api/uploads/image  (staff)
 * Uploads an image to Cloudinary (or returns inline URL in dev mode).
 */
export const uploadImageHandler = asyncHandler(async (req, res) => {
  const result = await uploadImage(req.body);
  res.status(201).json(result);
});
