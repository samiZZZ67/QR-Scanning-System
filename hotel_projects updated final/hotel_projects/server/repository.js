import { createDatabase } from "./db.js";
import { createPostgresRepository } from "./postgres.js";

export async function createRepository() {
  if (process.env.DATABASE_URL) {
    return createPostgresRepository(process.env.DATABASE_URL);
  }
  return createDatabase(process.env.DATABASE_PATH || "./data/hotel.sqlite");
}
