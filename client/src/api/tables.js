import { api } from './client.js';

export const listTables = () => api('/api/tables');

export const addTable = (body) => api('/api/tables', { method: 'POST', body });

export const deleteTable = (number) => api(`/api/tables/${number}`, { method: 'DELETE' });
