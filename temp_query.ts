import { db } from "./server/db";
import { products, categories } from "./shared/schema";
import { eq, ilike } from "drizzle-orm";

async function run() {
    const allProducts = await db.select().from(products);
    const pizzaProducts = allProducts.filter(p => p.name.toLowerCase().includes('pizza'));
    console.log("Found pizza products:", pizzaProducts.length);
    if (pizzaProducts.length > 0) {
        console.log("Sample pizza:");
        console.log(pizzaProducts[0].name, pizzaProducts[0].variants, pizzaProducts[0].price);
    }
}

run().catch(console.error).finally(() => process.exit(0));
