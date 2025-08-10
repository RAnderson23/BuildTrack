import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { parseReceiptWithAI } from "./services/receiptParser";
import {
  insertClientSchema,
  insertProjectSchema,
  insertContractSchema,
  insertLineItemSchema,
  insertReceiptSchema,
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads", "receipts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) and PDFs are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Contract routes
  app.get("/api/projects/:projectId/contracts", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const contracts = await storage.getContracts(projectId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post("/api/contracts", isAuthenticated, async (req: any, res) => {
    try {
      const contractData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(contractData);
      res.json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(400).json({ message: "Failed to create contract" });
    }
  });

  app.put("/api/contracts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const contractData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(id, contractData);
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(400).json({ message: "Failed to update contract" });
    }
  });

  // Line item routes
  app.get("/api/contracts/:contractId/line-items", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const lineItems = await storage.getLineItems(contractId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching line items:", error);
      res.status(500).json({ message: "Failed to fetch line items" });
    }
  });

  app.post("/api/line-items", isAuthenticated, async (req: any, res) => {
    try {
      const lineItemData = insertLineItemSchema.parse(req.body);
      const lineItem = await storage.createLineItem(lineItemData);
      res.json(lineItem);
    } catch (error) {
      console.error("Error creating line item:", error);
      res.status(400).json({ message: "Failed to create line item" });
    }
  });

  app.put("/api/line-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const lineItemData = insertLineItemSchema.partial().parse(req.body);
      const lineItem = await storage.updateLineItem(id, lineItemData);
      res.json(lineItem);
    } catch (error) {
      console.error("Error updating line item:", error);
      res.status(400).json({ message: "Failed to update line item" });
    }
  });

  app.delete("/api/line-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLineItem(id);
      res.json({ message: "Line item deleted successfully" });
    } catch (error) {
      console.error("Error deleting line item:", error);
      res.status(500).json({ message: "Failed to delete line item" });
    }
  });

  // Receipt routes
  app.get("/api/receipts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const receipts = await storage.getReceipts(userId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.post("/api/receipts/upload", isAuthenticated, upload.single("receipt"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const { projectId, contractId } = req.body;

      // Create receipt record
      const receiptData = insertReceiptSchema.parse({
        projectId: projectId || null,
        contractId: contractId || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        status: "pending",
        aiParsed: false,
      });

      const receipt = await storage.createReceipt(receiptData);

      // Parse receipt with AI in background
      parseReceiptWithAI(receipt.id, req.file.path).catch((error) => {
        console.error("AI parsing failed:", error);
      });

      res.json(receipt);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  app.put("/api/receipts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const receiptData = insertReceiptSchema.partial().parse(req.body);
      const receipt = await storage.updateReceipt(id, receiptData);
      res.json(receipt);
    } catch (error) {
      console.error("Error updating receipt:", error);
      res.status(400).json({ message: "Failed to update receipt" });
    }
  });

  app.delete("/api/receipts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReceipt(id);
      res.json({ message: "Receipt deleted successfully" });
    } catch (error) {
      console.error("Error deleting receipt:", error);
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  // Product routes for automated SKU management
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productData = insertProductSchema.parse({ ...req.body, userId });
      
      // Auto-generate SKU if not provided
      if (!productData.sku) {
        productData.sku = await storage.generateNextSku(userId, productData.category);
      }
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products/similar/:name', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name } = req.params;
      const similar = await storage.findSimilarProducts(userId, decodeURIComponent(name));
      res.json(similar);
    } catch (error) {
      console.error("Error finding similar products:", error);
      res.status(500).json({ message: "Failed to find similar products" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getProjectStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
