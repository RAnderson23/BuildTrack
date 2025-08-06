import {
  users,
  clients,
  projects,
  contracts,
  lineItems,
  receipts,
  receiptLineItems,
  type User,
  type UpsertUser,
  type InsertClient,
  type Client,
  type InsertProject,
  type Project,
  type InsertContract,
  type Contract,
  type InsertLineItem,
  type LineItem,
  type InsertReceipt,
  type Receipt,
  type InsertReceiptLineItem,
  type ReceiptLineItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Contract operations
  getContracts(projectId: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;

  // Line Item operations
  getLineItems(contractId: string): Promise<LineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: string, lineItem: Partial<InsertLineItem>): Promise<LineItem>;
  deleteLineItem(id: string): Promise<void>;

  // Receipt operations
  getReceipts(userId: string): Promise<Receipt[]>;
  getReceipt(id: string): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt>;
  deleteReceipt(id: string): Promise<void>;

  // Receipt Line Item operations
  getReceiptLineItems(receiptId: string): Promise<ReceiptLineItem[]>;
  createReceiptLineItem(lineItem: InsertReceiptLineItem): Promise<ReceiptLineItem>;
  updateReceiptLineItem(id: string, lineItem: Partial<InsertReceiptLineItem>): Promise<ReceiptLineItem>;
  deleteReceiptLineItem(id: string): Promise<void>;

  // Dashboard queries
  getProjectStats(userId: string): Promise<{
    activeProjects: number;
    pendingReceipts: number;
    totalRevenue: number;
    changeOrders: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    const results = await db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        budget: projects.budget,
        actualCost: projects.actualCost,
        startDate: projects.startDate,
        endDate: projects.endDate,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(clients.userId, userId))
      .orderBy(desc(projects.createdAt));
    
    return results;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Contract operations
  async getContracts(projectId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.projectId, projectId)).orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract> {
    const [updatedContract] = await db.update(contracts).set(contract).where(eq(contracts.id, id)).returning();
    return updatedContract;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // Line Item operations
  async getLineItems(contractId: string): Promise<LineItem[]> {
    return await db.select().from(lineItems).where(eq(lineItems.contractId, contractId));
  }

  async createLineItem(lineItem: InsertLineItem): Promise<LineItem> {
    const [newLineItem] = await db.insert(lineItems).values(lineItem).returning();
    return newLineItem;
  }

  async updateLineItem(id: string, lineItem: Partial<InsertLineItem>): Promise<LineItem> {
    const [updatedLineItem] = await db.update(lineItems).set(lineItem).where(eq(lineItems.id, id)).returning();
    return updatedLineItem;
  }

  async deleteLineItem(id: string): Promise<void> {
    await db.delete(lineItems).where(eq(lineItems.id, id));
  }

  // Receipt operations
  async getReceipts(userId: string): Promise<Receipt[]> {
    const results = await db
      .select({
        id: receipts.id,
        projectId: receipts.projectId,
        contractId: receipts.contractId,
        fileName: receipts.fileName,
        filePath: receipts.filePath,
        vendor: receipts.vendor,
        receiptDate: receipts.receiptDate,
        totalAmount: receipts.totalAmount,
        status: receipts.status,
        parsedData: receipts.parsedData,
        aiParsed: receipts.aiParsed,
        createdAt: receipts.createdAt,
      })
      .from(receipts)
      .leftJoin(projects, eq(receipts.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(or(eq(clients.userId, userId), isNull(receipts.projectId)))
      .orderBy(desc(receipts.createdAt));
    
    return results;
  }

  async getReceipt(id: string): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, id));
    return receipt;
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db.insert(receipts).values(receipt).returning();
    return newReceipt;
  }

  async updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt> {
    const [updatedReceipt] = await db.update(receipts).set(receipt).where(eq(receipts.id, id)).returning();
    return updatedReceipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  // Receipt Line Item operations
  async getReceiptLineItems(receiptId: string): Promise<ReceiptLineItem[]> {
    return await db.select().from(receiptLineItems).where(eq(receiptLineItems.receiptId, receiptId));
  }

  async createReceiptLineItem(lineItem: InsertReceiptLineItem): Promise<ReceiptLineItem> {
    const [newLineItem] = await db.insert(receiptLineItems).values(lineItem).returning();
    return newLineItem;
  }

  async updateReceiptLineItem(id: string, lineItem: Partial<InsertReceiptLineItem>): Promise<ReceiptLineItem> {
    const [updatedLineItem] = await db.update(receiptLineItems).set(lineItem).where(eq(receiptLineItems.id, id)).returning();
    return updatedLineItem;
  }

  async deleteReceiptLineItem(id: string): Promise<void> {
    await db.delete(receiptLineItems).where(eq(receiptLineItems.id, id));
  }

  // Dashboard queries
  async getProjectStats(userId: string): Promise<{
    activeProjects: number;
    pendingReceipts: number;
    totalRevenue: number;
    changeOrders: number;
  }> {
    // Get active projects count
    const activeProjectsResult = await db
      .select()
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(clients.userId, userId), eq(projects.status, "active")));

    // Get pending receipts count
    const pendingReceiptsResult = await db
      .select()
      .from(receipts)
      .innerJoin(projects, eq(receipts.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(clients.userId, userId), eq(receipts.status, "pending")));

    // Get total revenue (sum of approved contracts)
    const revenueResult = await db
      .select()
      .from(contracts)
      .innerJoin(projects, eq(contracts.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(clients.userId, userId), eq(contracts.status, "approved")));

    // Get change orders count
    const changeOrdersResult = await db
      .select()
      .from(contracts)
      .innerJoin(projects, eq(contracts.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(clients.userId, userId), eq(contracts.isChangeOrder, true)));

    const totalRevenue = revenueResult.reduce((sum, contract) => {
      return sum + parseFloat(contract.contracts.totalAmount || "0");
    }, 0);

    return {
      activeProjects: activeProjectsResult.length,
      pendingReceipts: pendingReceiptsResult.length,
      totalRevenue,
      changeOrders: changeOrdersResult.length,
    };
  }
}

export const storage = new DatabaseStorage();
