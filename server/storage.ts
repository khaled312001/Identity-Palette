import { db } from "./db";
import { eq, desc, sql, and, gte, lte, like, ilike, or } from "drizzle-orm";
import {
  branches, employees, categories, products, inventory,
  customers, sales, saleItems, suppliers, purchaseOrders,
  purchaseOrderItems, shifts, expenses, tables, kitchenOrders,
  subscriptionPlans, subscriptions, syncQueue,
  type InsertBranch, type InsertEmployee, type InsertCategory,
  type InsertProduct, type InsertInventory, type InsertCustomer,
  type InsertSale, type InsertSaleItem, type InsertSupplier,
  type InsertPurchaseOrder, type InsertShift, type InsertExpense,
  type InsertTable, type InsertKitchenOrder, type InsertSubscriptionPlan,
  type InsertSubscription,
} from "@shared/schema";

export const storage = {
  // Branches
  async getBranches() {
    return db.select().from(branches).orderBy(desc(branches.createdAt));
  },
  async getBranch(id: number) {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  },
  async createBranch(data: InsertBranch) {
    const [branch] = await db.insert(branches).values(data).returning();
    return branch;
  },
  async updateBranch(id: number, data: Partial<InsertBranch>) {
    const [branch] = await db.update(branches).set({ ...data, updatedAt: new Date() }).where(eq(branches.id, id)).returning();
    return branch;
  },

  // Employees
  async getEmployees() {
    return db.select().from(employees).orderBy(desc(employees.createdAt));
  },
  async getEmployee(id: number) {
    const [emp] = await db.select().from(employees).where(eq(employees.id, id));
    return emp;
  },
  async getEmployeeByPin(pin: string) {
    const [emp] = await db.select().from(employees).where(eq(employees.pin, pin));
    return emp;
  },
  async createEmployee(data: InsertEmployee) {
    const [emp] = await db.insert(employees).values(data).returning();
    return emp;
  },
  async updateEmployee(id: number, data: Partial<InsertEmployee>) {
    const [emp] = await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
    return emp;
  },
  async deleteEmployee(id: number) {
    await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
  },

  // Categories
  async getCategories() {
    return db.select().from(categories).orderBy(categories.sortOrder);
  },
  async createCategory(data: InsertCategory) {
    const [cat] = await db.insert(categories).values(data).returning();
    return cat;
  },
  async updateCategory(id: number, data: Partial<InsertCategory>) {
    const [cat] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return cat;
  },
  async deleteCategory(id: number) {
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
  },

  // Products
  async getProducts(search?: string) {
    if (search) {
      return db.select().from(products).where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.sku || "", `%${search}%`),
            ilike(products.barcode || "", `%${search}%`)
          )
        )
      ).orderBy(desc(products.createdAt));
    }
    return db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  },
  async getProduct(id: number) {
    const [prod] = await db.select().from(products).where(eq(products.id, id));
    return prod;
  },
  async getProductByBarcode(barcode: string) {
    const [prod] = await db.select().from(products).where(eq(products.barcode, barcode));
    return prod;
  },
  async createProduct(data: InsertProduct) {
    const [prod] = await db.insert(products).values(data).returning();
    return prod;
  },
  async updateProduct(id: number, data: Partial<InsertProduct>) {
    const [prod] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return prod;
  },
  async deleteProduct(id: number) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  },

  // Inventory
  async getInventory(branchId?: number) {
    if (branchId) {
      return db.select().from(inventory).where(eq(inventory.branchId, branchId));
    }
    return db.select().from(inventory);
  },
  async getProductInventory(productId: number, branchId: number) {
    const [inv] = await db.select().from(inventory).where(
      and(eq(inventory.productId, productId), eq(inventory.branchId, branchId))
    );
    return inv;
  },
  async upsertInventory(data: InsertInventory) {
    const existing = await this.getProductInventory(data.productId, data.branchId);
    if (existing) {
      const [inv] = await db.update(inventory)
        .set({ quantity: data.quantity, updatedAt: new Date() })
        .where(eq(inventory.id, existing.id)).returning();
      return inv;
    }
    const [inv] = await db.insert(inventory).values(data).returning();
    return inv;
  },
  async adjustInventory(productId: number, branchId: number, adjustment: number) {
    const existing = await this.getProductInventory(productId, branchId);
    if (existing) {
      const newQty = (existing.quantity || 0) + adjustment;
      const [inv] = await db.update(inventory)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(inventory.id, existing.id)).returning();
      return inv;
    }
    const [inv] = await db.insert(inventory).values({ productId, branchId, quantity: adjustment }).returning();
    return inv;
  },
  async getLowStockItems(branchId?: number) {
    const result = await db.select().from(inventory);
    return result.filter(item => (item.quantity || 0) <= (item.lowStockThreshold || 10));
  },

  // Customers
  async getCustomers(search?: string) {
    if (search) {
      return db.select().from(customers).where(
        and(
          eq(customers.isActive, true),
          or(
            ilike(customers.name, `%${search}%`),
            ilike(customers.phone || "", `%${search}%`),
            ilike(customers.email || "", `%${search}%`)
          )
        )
      ).orderBy(desc(customers.createdAt));
    }
    return db.select().from(customers).where(eq(customers.isActive, true)).orderBy(desc(customers.createdAt));
  },
  async getCustomer(id: number) {
    const [cust] = await db.select().from(customers).where(eq(customers.id, id));
    return cust;
  },
  async createCustomer(data: InsertCustomer) {
    const [cust] = await db.insert(customers).values(data).returning();
    return cust;
  },
  async updateCustomer(id: number, data: Partial<InsertCustomer>) {
    const [cust] = await db.update(customers).set({ ...data, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    return cust;
  },
  async addLoyaltyPoints(id: number, points: number) {
    const cust = await this.getCustomer(id);
    if (!cust) return null;
    return this.updateCustomer(id, { loyaltyPoints: (cust.loyaltyPoints || 0) + points });
  },

  // Sales
  async getSales(filters?: { branchId?: number; startDate?: Date; endDate?: Date; limit?: number }) {
    let query = db.select().from(sales).orderBy(desc(sales.createdAt));
    if (filters?.limit) {
      return db.select().from(sales).orderBy(desc(sales.createdAt)).limit(filters.limit);
    }
    return query;
  },
  async getSale(id: number) {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  },
  async createSale(data: InsertSale) {
    const [sale] = await db.insert(sales).values(data).returning();
    return sale;
  },
  async getSaleItems(saleId: number) {
    return db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  },
  async createSaleItem(data: InsertSaleItem) {
    const [item] = await db.insert(saleItems).values(data).returning();
    return item;
  },

  // Suppliers
  async getSuppliers() {
    return db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(desc(suppliers.createdAt));
  },
  async getSupplier(id: number) {
    const [sup] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return sup;
  },
  async createSupplier(data: InsertSupplier) {
    const [sup] = await db.insert(suppliers).values(data).returning();
    return sup;
  },
  async updateSupplier(id: number, data: Partial<InsertSupplier>) {
    const [sup] = await db.update(suppliers).set({ ...data, updatedAt: new Date() }).where(eq(suppliers.id, id)).returning();
    return sup;
  },

  // Purchase Orders
  async getPurchaseOrders() {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  },
  async createPurchaseOrder(data: InsertPurchaseOrder) {
    const [po] = await db.insert(purchaseOrders).values(data).returning();
    return po;
  },
  async updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>) {
    const [po] = await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id)).returning();
    return po;
  },

  // Shifts
  async getShifts() {
    return db.select().from(shifts).orderBy(desc(shifts.startTime));
  },
  async getActiveShift(employeeId: number) {
    const [shift] = await db.select().from(shifts).where(
      and(eq(shifts.employeeId, employeeId), eq(shifts.status, "open"))
    );
    return shift;
  },
  async createShift(data: InsertShift) {
    const [shift] = await db.insert(shifts).values(data).returning();
    return shift;
  },
  async closeShift(id: number, data: { closingCash?: string; totalSales?: string; totalTransactions?: number }) {
    const [shift] = await db.update(shifts).set({
      ...data,
      endTime: new Date(),
      status: "closed",
    }).where(eq(shifts.id, id)).returning();
    return shift;
  },

  // Expenses
  async getExpenses() {
    return db.select().from(expenses).orderBy(desc(expenses.createdAt));
  },
  async createExpense(data: InsertExpense) {
    const [exp] = await db.insert(expenses).values(data).returning();
    return exp;
  },

  // Tables
  async getTables(branchId?: number) {
    if (branchId) {
      return db.select().from(tables).where(eq(tables.branchId, branchId));
    }
    return db.select().from(tables);
  },
  async createTable(data: InsertTable) {
    const [table] = await db.insert(tables).values(data).returning();
    return table;
  },
  async updateTable(id: number, data: Partial<InsertTable>) {
    const [table] = await db.update(tables).set(data).where(eq(tables.id, id)).returning();
    return table;
  },

  // Kitchen Orders
  async getKitchenOrders(branchId?: number) {
    if (branchId) {
      return db.select().from(kitchenOrders).where(
        and(eq(kitchenOrders.branchId, branchId), eq(kitchenOrders.status, "pending"))
      ).orderBy(kitchenOrders.createdAt);
    }
    return db.select().from(kitchenOrders).where(eq(kitchenOrders.status, "pending")).orderBy(kitchenOrders.createdAt);
  },
  async createKitchenOrder(data: InsertKitchenOrder) {
    const [order] = await db.insert(kitchenOrders).values(data).returning();
    return order;
  },
  async updateKitchenOrder(id: number, data: Partial<InsertKitchenOrder>) {
    const [order] = await db.update(kitchenOrders).set({ ...data, updatedAt: new Date() }).where(eq(kitchenOrders.id, id)).returning();
    return order;
  },

  // Subscriptions
  async getSubscriptionPlans() {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  },
  async createSubscriptionPlan(data: InsertSubscriptionPlan) {
    const [plan] = await db.insert(subscriptionPlans).values(data).returning();
    return plan;
  },
  async getSubscriptions() {
    return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  },
  async createSubscription(data: InsertSubscription) {
    const [sub] = await db.insert(subscriptions).values(data).returning();
    return sub;
  },

  // Dashboard Stats
  async getDashboardStats() {
    const [salesCount] = await db.select({ count: sql<number>`count(*)` }).from(sales);
    const [totalRevenue] = await db.select({ total: sql<string>`coalesce(sum(total_amount::numeric), 0)` }).from(sales);
    const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
    const [lowStockCount] = await db.select({ count: sql<number>`count(*)` }).from(inventory).where(sql`quantity <= low_stock_threshold`);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [todaySales] = await db.select({
      count: sql<number>`count(*)`,
      total: sql<string>`coalesce(sum(total_amount::numeric), 0)`,
    }).from(sales).where(gte(sales.createdAt, todayStart));

    return {
      totalSales: Number(salesCount?.count || 0),
      totalRevenue: Number(totalRevenue?.total || 0),
      totalCustomers: Number(customerCount?.count || 0),
      totalProducts: Number(productCount?.count || 0),
      lowStockItems: Number(lowStockCount?.count || 0),
      todaySalesCount: Number(todaySales?.count || 0),
      todayRevenue: Number(todaySales?.total || 0),
    };
  },
};
