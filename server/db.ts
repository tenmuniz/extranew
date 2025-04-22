import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

export const isDatabaseEnabled = Boolean(process.env.DATABASE_URL);

if (!isDatabaseEnabled) {
  console.log('DATABASE_URL not set, using in-memory storage');
}

export const pool = isDatabaseEnabled 
  ? new Pool({ connectionString: process.env.DATABASE_URL }) 
  : undefined;

export const db: NodePgDatabase<typeof schema> | undefined = pool
  ? drizzle(pool, { schema })
  : undefined;
