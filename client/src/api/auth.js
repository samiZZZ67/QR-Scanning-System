import { api } from './client.js';

export const createSession = (pin, role) =>
  api('/api/staff/session', {
    method: 'POST',
    body: { pin, role },
    tokenOverride: '',
    authOptional: true
  });
