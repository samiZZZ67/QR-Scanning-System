import client from './client.js';

export async function listRooms() {
  const { data } = await client.get('/tables/rooms');
  return data;
}

export async function addRoom(room) {
  const { data } = await client.post('/tables/rooms', room);
  return data;
}

export async function updateRoom(id, room) {
  const { data } = await client.patch(`/tables/rooms/${id}`, room);
  return data;
}

export async function deleteRoom(id) {
  await client.delete(`/tables/rooms/${id}`);
}
