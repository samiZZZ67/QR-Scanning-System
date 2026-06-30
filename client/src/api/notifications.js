import client from './client.js';

// Service Notifications (call waiter, request bill)
export async function createServiceNotification(notification) {
  const { data } = await client.post('/service-notifications', notification);
  return data;
}

export async function listServiceNotifications(filters = {}) {
  const { data } = await client.get('/service-notifications', { params: filters });
  return data;
}

export async function resolveServiceNotification(id) {
  const { data } = await client.patch(`/service-notifications/${id}/resolve`);
  return data;
}

// Manager Notifications (staff calls manager)
export async function createManagerNotification(notification) {
  const { data } = await client.post('/manager-notifications', notification);
  return data;
}

export async function listManagerNotifications(filters = {}) {
  const { data } = await client.get('/manager-notifications', { params: filters });
  return data;
}

export async function resolveManagerNotification(id) {
  const { data } = await client.patch(`/manager-notifications/${id}/resolve`);
  return data;
}
