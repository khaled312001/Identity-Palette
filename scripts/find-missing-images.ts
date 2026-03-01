import { config } from "dotenv";
config();
import { db } from "../server/db";
import { products, categories as cats } from "@shared/schema";
import { eq, and, notLike } from "drizzle-orm";

async function run() {
    console.log("Finding missing images...");
    const missing = await db.select({
        id: products.id,
        name: products.name,
        image: products.image,
        categoryName: cats.name,
    }).from(products)
        .leftJoin(cats, eq(products.categoryId, cats.id))
        .where(
            and(
                eq(products.tenantId, 18),
                notLike(products.image, "/objects/%")
            )
        );

    console.log(`Found ${missing.length} products with remote/missing images.`);
    for (const p of missing) {
        console.log(`- ${p.name} (Cat: ${p.categoryName}) | Current: ${p.image}`);
    }
}

run().catch(console.error).finally(() => process.exit(0));
