import { api } from './client.js';

export const getTodayReport = () => api('/api/reports/today');

export const getRangeReport = (params) =>
  api(`/api/reports/range?${new URLSearchParams(params)}`);
