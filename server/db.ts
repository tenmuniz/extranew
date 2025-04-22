import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const useInMemoryStorage = !process.env.DATABASE_URL;
let pool;
let db;

if (useInMemoryStorage) {
  console.log('DATABASE_URL not set, using in-memory storage');
  // Set up in-memory SQLite or similar fallback
  // This is temporary until you set up the real database
  db = new Map();
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db };
