import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('FATAL: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
