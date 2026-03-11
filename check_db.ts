
import { db } from "./server/db";
import { landingPageConfig, tenants } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkStore() {
    try {
        const configs = await db.select().from(landingPageConfig);
        console.log("Configs found:", configs.length);
        for (const c of configs) {
            console.log(`Slug: ${c.slug}, TenantID: ${c.tenantId}, Published: ${c.isPublished}`);
        }

        const allTenants = await db.select().from(tenants);
        console.log("Tenants found:", allTenants.length);
        for (const t of allTenants) {
            console.log(`ID: ${t.id}, Business: ${t.businessName}, Email: ${t.ownerEmail}`);
        }
    } catch (e) {
        console.error("Error checking store:", e);
    } finally {
        process.exit();
    }
}

checkStore();
