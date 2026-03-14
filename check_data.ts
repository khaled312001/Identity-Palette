
import { db } from "./server/db";
import { categories, products, tenants } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function check() {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.ownerEmail, "admin@pizzalemon.ch"));
    if (!tenant) {
        console.log("Tenant not found");
        return;
    }
    console.log("Tenant ID:", tenant.id);

    const cats = await db.select().from(categories).where(eq(categories.tenantId, tenant.id));
    const catMap = new Map(cats.map(c => [c.id, c.name]));

    console.log("\nCategories:");
    cats.forEach(c => {
        console.log(`- ${c.name} (ID: ${c.id}, isActive: ${c.isActive})`);
    });

    const prods = await db.select().from(products).where(eq(products.tenantId, tenant.id));
    console.log("\nProducts Sample (first 10):");
    prods.slice(0, 10).forEach(p => {
        console.log(`- ${p.name} (ID: ${p.id}, catID: ${p.categoryId}, catName: ${catMap.get(p.categoryId!) || 'NONE'}, isActive: ${p.isActive})`);
    });

    console.log("\nProducts per Category:");
    const prodCount: Record<number, number> = {};
    const orphanedProds: any[] = [];
    prods.forEach(p => {
        if (p.categoryId) {
            prodCount[p.categoryId] = (prodCount[p.categoryId] || 0) + (p.isActive ? 1 : 0);
            if (!catMap.has(p.categoryId)) {
                orphanedProds.push(p.name);
            }
        } else {
            orphanedProds.push(p.name);
        }
    });

    cats.forEach(c => {
        console.log(`- ${c.name}: ${prodCount[c.id] || 0} active products`);
    });

    if (orphanedProds.length > 0) {
        console.log("\nOrphaned Products (no category or invalid category):", orphanedProds.length);
        console.log(orphanedProds.slice(0, 5).join(", ") + (orphanedProds.length > 5 ? "..." : ""));
    }

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
