import client from './client.js';

export async function listStaffMembers() {
  const { data } = await client.get('/tables/staff');
  return data;
}

export async function createStaffMember(staff) {
  const { data } = await client.post('/tables/staff', staff);
  return data;
}

export async function updateStaffMember(id, staff) {
  const { data } = await client.patch(`/tables/staff/${id}`, staff);
  return data;
}

export async function deleteStaffMember(id) {
  await client.delete(`/tables/staff/${id}`);
}

export async function setStaffOnline(id, online) {
  const { data } = await client.patch(`/tables/staff/${id}/online`, { online });
  return data;
}
