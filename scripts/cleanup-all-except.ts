/**
 * Cleanup script to delete all tenants except the one specified
 * Run: npx tsx scripts/cleanup-all-except.ts <tenantIdToKeep>
 */

import { db } from "../server/db";
import { tenants } from "../shared/schema";
import { ne } from "drizzle-orm";

async function cleanup() {
    const tenantIdToKeep = process.argv[2] ? parseInt(process.argv[2]) : null;

    if (!tenantIdToKeep) {
        console.error("❌ Please provide a tenant ID to keep.");
        process.exit(1);
    }

    console.log(`🧹 Cleaning up all tenants except ID: ${tenantIdToKeep}...`);

    try {
        const result = await db.delete(tenants).where(ne(tenants.id, tenantIdToKeep)).returning();
        console.log(`✅ Deleted ${result.length} tenants and their associated data (via cascade).`);
        console.log("Remaining tenants:");
        const remaining = await db.select().from(tenants);
        console.log(JSON.stringify(remaining, null, 2));
    } catch (err) {
        console.error("❌ Cleanup failed:", err);
    }

    process.exit(0);
}

cleanup().catch(console.error);
