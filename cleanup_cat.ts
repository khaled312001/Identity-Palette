
import { db } from "./server/db";
import { categories, products } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function cleanup() {
    const catName = "Döner / Fingerfood";
    const [cat] = await db.select().from(categories).where(and(eq(categories.name, catName), eq(categories.tenantId, 24)));

    if (cat) {
        console.log(`Found legacy category: ${catName} (ID: ${cat.id})`);
        // Double check it has no products
        const prods = await db.select().from(products).where(eq(products.categoryId, cat.id));
        if (prods.length === 0) {
            console.log("No products found. Deleting...");
            await db.delete(categories).where(eq(categories.id, cat.id));
            console.log("Deleted.");
        } else {
            console.log(`Warning: Found ${prods.length} products in this category. Skipping delete.`);
        }
    } else {
        console.log(`Category ${catName} not found for tenant 24.`);
    }

    process.exit(0);
}

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
