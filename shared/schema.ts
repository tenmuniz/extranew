import { pgTable, text, serial, integer, boolean, date, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define ranks for military personnel
export const rankEnum = z.enum([
  "SD",     // Soldado
  "CB",     // Cabo
  "3SGT",   // 3º Sargento
  "2SGT",   // 2º Sargento
  "1SGT",   // 1º Sargento
  "SUBTEN", // Sub-Tenente
  "TEN",    // Tenente
  "1TEN",   // 1º Tenente
  "CAP"     // Capitão
]);

// Personnel table
export const personnel = pgTable("personnel", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rank: text("rank", { enum: ["SD", "CB", "3SGT", "2SGT", "1SGT", "SUBTEN", "TEN", "1TEN", "CAP"] }).notNull(),
  extras: integer("extras").notNull().default(0),
});

// Operation types
export const operationTypeEnum = z.enum([
  "PMF",    // Polícia Mais Forte
  "ESCOLA"  // Escola Segura
]);

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id, { onDelete: "cascade" }),
  operationType: text("operation_type", { enum: ["PMF", "ESCOLA"] }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create zod schemas for inserting
export const insertPersonnelSchema = createInsertSchema(personnel);
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });

// Zod schema for date range queries
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

// Type definitions
export type Rank = z.infer<typeof rankEnum>;
export type OperationType = z.infer<typeof operationTypeEnum>;
export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
