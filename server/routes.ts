import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard
  app.get("/api/dashboard", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Branches
  app.get("/api/branches", async (_req, res) => {
    try { res.json(await storage.getBranches()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/branches", async (req, res) => {
    try { res.json(await storage.createBranch(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/branches/:id", async (req, res) => {
    try { res.json(await storage.updateBranch(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Employees
  app.get("/api/employees", async (_req, res) => {
    try { res.json(await storage.getEmployees()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const emp = await storage.getEmployee(Number(req.params.id));
      if (!emp) return res.status(404).json({ error: "Employee not found" });
      res.json(emp);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/employees", async (req, res) => {
    try { res.json(await storage.createEmployee(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/employees/:id", async (req, res) => {
    try { res.json(await storage.updateEmployee(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/employees/:id", async (req, res) => {
    try { await storage.deleteEmployee(Number(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/employees/login", async (req, res) => {
    try {
      const emp = await storage.getEmployeeByPin(req.body.pin);
      if (!emp) return res.status(401).json({ error: "Invalid PIN" });
      if (!emp.isActive) return res.status(401).json({ error: "Account deactivated" });
      res.json(emp);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    try { res.json(await storage.getCategories()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/categories", async (req, res) => {
    try { res.json(await storage.createCategory(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/categories/:id", async (req, res) => {
    try { res.json(await storage.updateCategory(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/categories/:id", async (req, res) => {
    try { await storage.deleteCategory(Number(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try { res.json(await storage.getProducts(req.query.search as string)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/products/:id", async (req, res) => {
    try {
      const prod = await storage.getProduct(Number(req.params.id));
      if (!prod) return res.status(404).json({ error: "Product not found" });
      res.json(prod);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const prod = await storage.getProductByBarcode(req.params.barcode);
      if (!prod) return res.status(404).json({ error: "Product not found" });
      res.json(prod);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/products", async (req, res) => {
    try { res.json(await storage.createProduct(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/products/:id", async (req, res) => {
    try { res.json(await storage.updateProduct(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/products/:id", async (req, res) => {
    try { await storage.deleteProduct(Number(req.params.id)); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Inventory
  app.get("/api/inventory", async (req, res) => {
    try { res.json(await storage.getInventory(req.query.branchId ? Number(req.query.branchId) : undefined)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory", async (req, res) => {
    try { res.json(await storage.upsertInventory(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/inventory/adjust", async (req, res) => {
    try {
      const { productId, branchId, adjustment } = req.body;
      res.json(await storage.adjustInventory(productId, branchId, adjustment));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/inventory/low-stock", async (_req, res) => {
    try { res.json(await storage.getLowStockItems()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    try { res.json(await storage.getCustomers(req.query.search as string)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const cust = await storage.getCustomer(Number(req.params.id));
      if (!cust) return res.status(404).json({ error: "Customer not found" });
      res.json(cust);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/customers", async (req, res) => {
    try { res.json(await storage.createCustomer(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/customers/:id", async (req, res) => {
    try { res.json(await storage.updateCustomer(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/customers/:id/loyalty", async (req, res) => {
    try { res.json(await storage.addLoyaltyPoints(Number(req.params.id), req.body.points)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      res.json(await storage.getSales({ limit }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/sales/:id", async (req, res) => {
    try {
      const sale = await storage.getSale(Number(req.params.id));
      if (!sale) return res.status(404).json({ error: "Sale not found" });
      const items = await storage.getSaleItems(sale.id);
      res.json({ ...sale, items });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/sales", async (req, res) => {
    try {
      const { items, ...saleData } = req.body;
      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const sale = await storage.createSale({ ...saleData, receiptNumber });
      if (items && items.length > 0) {
        for (const item of items) {
          await storage.createSaleItem({ ...item, saleId: sale.id });
          if (saleData.branchId) {
            await storage.adjustInventory(item.productId, saleData.branchId, -item.quantity);
          }
        }
      }
      if (saleData.customerId) {
        const points = Math.floor(Number(saleData.totalAmount) / 10);
        await storage.addLoyaltyPoints(saleData.customerId, points);
        await storage.updateCustomer(saleData.customerId, {
          totalSpent: String(Number(saleData.totalAmount)),
        });
      }
      res.json(sale);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Suppliers
  app.get("/api/suppliers", async (_req, res) => {
    try { res.json(await storage.getSuppliers()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const sup = await storage.getSupplier(Number(req.params.id));
      if (!sup) return res.status(404).json({ error: "Supplier not found" });
      res.json(sup);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/suppliers", async (req, res) => {
    try { res.json(await storage.createSupplier(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/suppliers/:id", async (req, res) => {
    try { res.json(await storage.updateSupplier(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Purchase Orders
  app.get("/api/purchase-orders", async (_req, res) => {
    try { res.json(await storage.getPurchaseOrders()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/purchase-orders", async (req, res) => {
    try { res.json(await storage.createPurchaseOrder(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/purchase-orders/:id", async (req, res) => {
    try { res.json(await storage.updatePurchaseOrder(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Shifts
  app.get("/api/shifts", async (_req, res) => {
    try { res.json(await storage.getShifts()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/shifts", async (req, res) => {
    try { res.json(await storage.createShift(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/shifts/:id/close", async (req, res) => {
    try { res.json(await storage.closeShift(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Expenses
  app.get("/api/expenses", async (_req, res) => {
    try { res.json(await storage.getExpenses()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/expenses", async (req, res) => {
    try { res.json(await storage.createExpense(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Tables
  app.get("/api/tables", async (req, res) => {
    try { res.json(await storage.getTables(req.query.branchId ? Number(req.query.branchId) : undefined)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/tables", async (req, res) => {
    try { res.json(await storage.createTable(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/tables/:id", async (req, res) => {
    try { res.json(await storage.updateTable(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Kitchen Orders
  app.get("/api/kitchen-orders", async (req, res) => {
    try { res.json(await storage.getKitchenOrders(req.query.branchId ? Number(req.query.branchId) : undefined)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/kitchen-orders", async (req, res) => {
    try { res.json(await storage.createKitchenOrder(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/kitchen-orders/:id", async (req, res) => {
    try { res.json(await storage.updateKitchenOrder(Number(req.params.id), req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Subscriptions
  app.get("/api/subscription-plans", async (_req, res) => {
    try { res.json(await storage.getSubscriptionPlans()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/subscription-plans", async (req, res) => {
    try { res.json(await storage.createSubscriptionPlan(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/subscriptions", async (_req, res) => {
    try { res.json(await storage.getSubscriptions()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/subscriptions", async (req, res) => {
    try { res.json(await storage.createSubscription(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Seed data
  app.post("/api/seed", async (_req, res) => {
    try {
      const existingBranches = await storage.getBranches();
      if (existingBranches.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      const branch = await storage.createBranch({
        name: "Main Branch",
        address: "123 Main Street",
        phone: "+1234567890",
        isMain: true,
        currency: "USD",
        taxRate: "10",
      });

      await storage.createEmployee({
        name: "Admin",
        email: "admin@barmagly.com",
        pin: "1234",
        role: "admin",
        branchId: branch.id,
        permissions: ["all"],
      });

      await storage.createEmployee({
        name: "Cashier",
        email: "cashier@barmagly.com",
        pin: "0000",
        role: "cashier",
        branchId: branch.id,
        permissions: ["pos", "customers"],
      });

      const cats = [
        { name: "Beverages", nameAr: null, color: "#3B82F6", icon: "cafe" },
        { name: "Food", nameAr: null, color: "#EF4444", icon: "restaurant" },
        { name: "Desserts", nameAr: null, color: "#F59E0B", icon: "ice-cream" },
        { name: "Electronics", nameAr: null, color: "#8B5CF6", icon: "hardware-chip" },
        { name: "Clothing", nameAr: null, color: "#10B981", icon: "shirt" },
      ];
      const createdCats: any[] = [];
      for (const c of cats) {
        createdCats.push(await storage.createCategory(c));
      }

      const prods = [
        { name: "Espresso", price: "3.50", costPrice: "1.00", categoryId: createdCats[0].id, sku: "BEV-001", barcode: "1234567890123", unit: "cup" },
        { name: "Cappuccino", price: "4.50", costPrice: "1.50", categoryId: createdCats[0].id, sku: "BEV-002", barcode: "1234567890124", unit: "cup" },
        { name: "Latte", price: "5.00", costPrice: "1.50", categoryId: createdCats[0].id, sku: "BEV-003", barcode: "1234567890125", unit: "cup" },
        { name: "Green Tea", price: "3.00", costPrice: "0.80", categoryId: createdCats[0].id, sku: "BEV-004", barcode: "1234567890126", unit: "cup" },
        { name: "Chicken Burger", price: "8.50", costPrice: "3.50", categoryId: createdCats[1].id, sku: "FOOD-001", barcode: "2234567890123", unit: "piece" },
        { name: "Caesar Salad", price: "7.00", costPrice: "2.50", categoryId: createdCats[1].id, sku: "FOOD-002", barcode: "2234567890124", unit: "plate" },
        { name: "Margherita Pizza", price: "12.00", costPrice: "4.00", categoryId: createdCats[1].id, sku: "FOOD-003", barcode: "2234567890125", unit: "piece" },
        { name: "Chocolate Cake", price: "6.00", costPrice: "2.00", categoryId: createdCats[2].id, sku: "DES-001", barcode: "3234567890123", unit: "slice" },
        { name: "Ice Cream Sundae", price: "5.50", costPrice: "1.80", categoryId: createdCats[2].id, sku: "DES-002", barcode: "3234567890124", unit: "cup" },
        { name: "USB Cable", price: "9.99", costPrice: "3.00", categoryId: createdCats[3].id, sku: "ELEC-001", barcode: "4234567890123", unit: "piece" },
        { name: "Phone Case", price: "15.00", costPrice: "5.00", categoryId: createdCats[3].id, sku: "ELEC-002", barcode: "4234567890124", unit: "piece" },
        { name: "T-Shirt", price: "25.00", costPrice: "10.00", categoryId: createdCats[4].id, sku: "CLO-001", barcode: "5234567890123", unit: "piece" },
      ];
      for (const p of prods) {
        const prod = await storage.createProduct(p);
        await storage.upsertInventory({ productId: prod.id, branchId: branch.id, quantity: Math.floor(Math.random() * 100) + 10 });
      }

      await storage.createCustomer({ name: "Walk-in Customer", phone: "N/A" });
      await storage.createCustomer({ name: "John Smith", phone: "+1555000111", email: "john@example.com", loyaltyPoints: 150 });
      await storage.createCustomer({ name: "Sarah Johnson", phone: "+1555000222", email: "sarah@example.com", loyaltyPoints: 300 });

      await storage.createSupplier({ name: "Fresh Foods Co.", contactName: "Mike", phone: "+1555111000", email: "mike@freshfoods.com", paymentTerms: "Net 30" });
      await storage.createSupplier({ name: "Tech Supplies Ltd.", contactName: "Lisa", phone: "+1555222000", email: "lisa@techsupplies.com", paymentTerms: "Net 15" });

      for (let i = 1; i <= 6; i++) {
        await storage.createTable({ branchId: branch.id, name: `Table ${i}`, capacity: i <= 3 ? 4 : 6, posX: (i - 1) % 3 * 120, posY: Math.floor((i - 1) / 3) * 120 });
      }

      res.json({ message: "Seed data created successfully" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  const httpServer = createServer(app);
  return httpServer;
}
