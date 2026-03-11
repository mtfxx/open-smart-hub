import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:smarthub2026@localhost:5432/smarthub',
});

export const db = drizzle(pool, { schema });
