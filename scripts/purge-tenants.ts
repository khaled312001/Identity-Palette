import { db } from "../server/db";
import {
    tenants, branches, employees, categories, products, inventory,
    tenantSubscriptions, licenseKeys, tenantNotifications,
    sales, saleItems, shifts, activityLog, customers,
    expenses, purchaseOrders, purchaseOrderItems,
    suppliers, warehouses, tables,
    kitchenOrders, activityLog as logTable
} from "../shared/schema";
import { eq, ne, inArray } from "drizzle-orm";

async function purgeOtherTenants() {
    const KEEP_TENANT_ID = 15;

    console.log(`🧹 DANGEROUS PURGE BEGUN: Deleting everything except Tenant ID ${KEEP_TENANT_ID}...\n`);

    // 1. Get other tenants
    const others = await db.select().from(tenants).where(ne(tenants.id, KEEP_TENANT_ID));
    const otherIds = others.map(t => t.id);

    if (otherIds.length === 0) {
        console.log("✅ No other tenants found. Environment is clean.");
        process.exit(0);
    }

    console.log(`🚨 Found ${otherIds.length} other tenants to delete: ${otherIds.join(", ")}`);

    // 2. Cascade delete manually
    const otherBranches = await db.select().from(branches).where(inArray(branches.tenantId, otherIds));
    const otherBranchIds = otherBranches.map(b => b.id);

    console.log(`🗑️ Deleting data for ${otherBranchIds.length} branches...`);

    try {
        // Delete by tenantId
        if (otherIds.length > 0) {
            await db.delete(products).where(inArray(products.tenantId, otherIds));
            await db.delete(categories).where(inArray(categories.tenantId, otherIds));
            await db.delete(customers).where(inArray(customers.tenantId, otherIds));
            await db.delete(suppliers).where(inArray(suppliers.tenantId, otherIds));
            await db.delete(tenantSubscriptions).where(inArray(tenantSubscriptions.tenantId, otherIds));
            await db.delete(licenseKeys).where(inArray(licenseKeys.tenantId, otherIds));
            await db.delete(tenantNotifications).where(inArray(tenantNotifications.tenantId, otherIds));
            await db.delete(expenses).where(inArray(expenses.tenantId, otherIds));
        }

        // Delete by branchId
        if (otherBranchIds.length > 0) {
            await db.delete(inventory).where(inArray(inventory.branchId, otherBranchIds));
            // For shifts and sales, we delete those referring to branchIds we are about to delete
            await db.delete(shifts).where(inArray(shifts.branchId, otherBranchIds));
            await db.delete(sales).where(inArray(sales.branchId, otherBranchIds));
            await db.delete(warehouses).where(inArray(warehouses.branchId, otherBranchIds));
            await db.delete(tables).where(inArray(tables.branchId, otherBranchIds));
            await db.delete(kitchenOrders).where(inArray(kitchenOrders.branchId, otherBranchIds));
            await db.delete(branches).where(inArray(branches.id, otherBranchIds));
        }

        // Final delete tenants
        await db.delete(tenants).where(inArray(tenants.id, otherIds));

        console.log("\n✨ FINAL PURGE COMPLETE. Only Pizza Lemon (ID 15) remains.");
    } catch (e) {
        console.error("❌ Purge failed:", e);
        process.exit(1);
    }

    process.exit(0);
}

purgeOtherTenants().catch((err) => {
    console.error("❌ Purge failed:", err);
    process.exit(1);
});
