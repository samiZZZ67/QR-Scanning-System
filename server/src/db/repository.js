import { createDatabase } from './sqlite.js';
import { createPostgresRepository } from './postgres.js';
import config from '../config/env.js';

export async function createRepository() {
  if (config.databaseUrl) {
    return createPostgresRepository(config.databaseUrl);
  }
  return createDatabase(config.databasePath);
}
