import { api } from './client.js';

export const createSession = (pin, pinOverride) =>
  api('/api/staff/session', { method: 'POST', body: { pin }, pinOverride });
