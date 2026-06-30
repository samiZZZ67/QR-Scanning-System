import client from './client.js';

export async function listFloors() {
  const { data } = await client.get('/tables/floors');
  return data;
}

export async function addFloor(floor) {
  const { data } = await client.post('/tables/floors', floor);
  return data;
}

export async function updateFloor(id, floor) {
  const { data } = await client.patch(`/tables/floors/${id}`, floor);
  return data;
}

export async function deleteFloor(id) {
  await client.delete(`/tables/floors/${id}`);
}
