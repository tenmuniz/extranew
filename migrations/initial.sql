-- Initial schema migration
CREATE TABLE IF NOT EXISTS "personnel" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "rank" TEXT NOT NULL,
  "extras" INTEGER NOT NULL DEFAULT 0,
  "platoon" TEXT NOT NULL DEFAULT 'EXPEDIENTE'
);

CREATE TABLE IF NOT EXISTS "assignments" (
  "id" SERIAL PRIMARY KEY,
  "personnel_id" INTEGER NOT NULL,
  "operation_type" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("personnel_id") REFERENCES "personnel"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "assignments_personnel_id_idx" ON "assignments" ("personnel_id");
CREATE INDEX IF NOT EXISTS "assignments_date_idx" ON "assignments" ("date");
CREATE INDEX IF NOT EXISTS "assignments_operation_type_idx" ON "assignments" ("operation_type");