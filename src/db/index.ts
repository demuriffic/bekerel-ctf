import * as schema from './schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

let dbInstance: any = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString && !connectionString.includes('memory') && !connectionString.includes('localhost:0')) {
    const { neon } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-http');
    const sql = neon(connectionString);
    dbInstance = drizzle({ client: sql, schema });
    return dbInstance;
  }

  // Fallback to PGlite for local development and testing
  const { PGlite } = require('@electric-sql/pglite');
  const { drizzle } = require('drizzle-orm/pglite');
  const path = require('path');
  const fs = require('fs');

  const dbPath = path.join(process.cwd(), '.local_db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  const client = new PGlite(dbPath);
  dbInstance = drizzle({ client, schema });
  return dbInstance;
}

export const db: NeonHttpDatabase<typeof schema> = new Proxy({} as any, {
  get(_target, prop) {
    const activeDb = getDb();
    const value = (activeDb as any)[prop];
    return typeof value === 'function' ? value.bind(activeDb) : value;
  },
});

export * from './schema';
