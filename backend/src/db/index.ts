import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:smarthub2026@127.0.0.1:5433/smarthub',
});

export const db = drizzle(pool, { schema });
