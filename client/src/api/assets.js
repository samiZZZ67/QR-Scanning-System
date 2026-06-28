import { api } from './client.js';

export const listAssets = () => api('/api/assets');

export const updateAsset = (key, body) =>
  api(`/api/assets/${key}`, { method: 'PATCH', body });

export const uploadImage = (body) =>
  api('/api/uploads/image', { method: 'POST', body });
