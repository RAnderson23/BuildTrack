import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("planning"), // planning, active, completed, on_hold
  budget: decimal("budget", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts table
export const contracts: any = pgTable("contracts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  parentContractId: uuid("parent_contract_id"),
  contractNumber: varchar("contract_number").notNull().unique(),
  title: varchar("title").notNull(),
  type: varchar("type").notNull().default("estimate"), // estimate, contract
  isChangeOrder: boolean("is_change_order").default(false),
  status: varchar("status").notNull().default("draft"), // draft, pending, approved, rejected
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  contractDate: timestamp("contract_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Line Items table
export const lineItems = pgTable("line_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  sku: varchar("sku"),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipts table
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  vendor: varchar("vendor"),
  receiptDate: timestamp("receipt_date"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  parsedData: jsonb("parsed_data"),
  aiParsed: boolean("ai_parsed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipt Line Items table for parsed items
export const receiptLineItems = pgTable("receipt_line_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: uuid("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  sku: varchar("sku"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  contracts: many(contracts),
  receipts: many(receipts),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  project: one(projects, {
    fields: [contracts.projectId],
    references: [projects.id],
  }),
  parentContract: one(contracts, {
    fields: [contracts.parentContractId],
    references: [contracts.id],
  }),
  lineItems: many(lineItems),
  receipts: many(receipts),
  changeOrders: many(contracts),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  contract: one(contracts, {
    fields: [lineItems.contractId],
    references: [contracts.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  project: one(projects, {
    fields: [receipts.projectId],
    references: [projects.id],
  }),
  contract: one(contracts, {
    fields: [receipts.contractId],
    references: [contracts.id],
  }),
  lineItems: many(receiptLineItems),
}));

export const receiptLineItemsRelations = relations(receiptLineItems, ({ one }) => ({
  receipt: one(receipts, {
    fields: [receiptLineItems.receiptId],
    references: [receipts.id],
  }),
}));

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true }).extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertLineItemSchema = createInsertSchema(lineItems).omit({ id: true, createdAt: true });
export const insertReceiptSchema = createInsertSchema(receipts).omit({ id: true, createdAt: true });
export const insertReceiptLineItemSchema = createInsertSchema(receiptLineItems).omit({ id: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Products/SKU table for automated SKU management
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sku: varchar("sku").notNull().unique(),
  name: varchar("name").notNull(),
  description: varchar("description"),
  category: varchar("category"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  unit: varchar("unit").default("each"), // each, linear ft, sq ft, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
}));

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceiptLineItem = z.infer<typeof insertReceiptLineItemSchema>;
export type ReceiptLineItem = typeof receiptLineItems.$inferSelect;
