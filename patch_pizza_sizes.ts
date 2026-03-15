import { db } from "./server/db";
import { products, categories } from "./shared/schema";
import { eq, ilike } from "drizzle-orm";

const PIZZA_PRICES: Record<string, { price33: number, price45: number }> = {
    "MARGHERITA": { price33: 14, price45: 25 },
    "PROFUMATA": { price33: 14, price45: 27 },
    "FUNGHI": { price33: 15, price45: 28 },
    "SPINAT": { price33: 15, price45: 28 },
    "GORGONZOLA": { price33: 16, price45: 29 },
    "PROSCIUTTO": { price33: 16, price45: 30 },
    "SALAMI": { price33: 16, price45: 30 },
    "DIAVOLA": { price33: 17, price45: 31 },
    "ARRABBIATA": { price33: 17, price45: 31 },
    "SICILIANA": { price33: 17, price45: 31 },
    "PROSCIUTTO E FUNGHI": { price33: 17, price45: 31 },
    "HAWAII": { price33: 17, price45: 31 },
    "TONNO": { price33: 17, price45: 31 },
    "PICCANTE": { price33: 18, price45: 32 },
    "RACLETTE": { price33: 18, price45: 32 }, // Capitalized mapping
    "FIORENTINA": { price33: 18, price45: 32 },
    "KEBAB PIZZA": { price33: 19, price45: 33 },
    "POULET": { price33: 19, price45: 33 },
    "CARBONARA": { price33: 19, price45: 33 },
    "GAMBERETTI": { price33: 19, price45: 33 },
    "QUATTRO FORMAGGI": { price33: 19, price45: 33 },
    "QUATTRO STAGIONI": { price33: 19, price45: 33 },
    "FRUTTI DI MARE": { price33: 19, price45: 33 },
    "VERDURA": { price33: 19, price45: 33 },
    "NAPOLI": { price33: 18, price45: 32 },
    "PIZZAIOLO": { price33: 18, price45: 32 },
    "A'CASA": { price33: 19, price45: 34 },
    "PORCINI": { price33: 19, price45: 34 },
    "SPEZIAL": { price33: 19, price45: 34 },
    "PADRONE": { price33: 20, price45: 33 },
    "SCHLOSS PIZZA": { price33: 20, price45: 34 },
    "ITALIANO": { price33: 20, price45: 34 },
    "AMERICANO": { price33: 20, price45: 34 },
    "LEMON PIZZA": { price33: 20, price45: 34 },
};

async function patchPizzaSizes() {
    console.log("Starting pizza sizes patch...");

    // Fetch all products
    const allProducts = await db.select().from(products);

    // Also fetch pizza categories just in case the name isn't explicit but it's in a pizza category
    const allCategories = await db.select().from(categories);
    const pizzaCategoryIds = allCategories
        .filter(c => c.name.toLowerCase().includes('pizza'))
        .map(c => c.id);

    console.log(`Found ${pizzaCategoryIds.length} categories with 'pizza' in the name.`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const product of allProducts) {
        const isPizza = product.name.toLowerCase().includes('pizza') || (product.categoryId && pizzaCategoryIds.includes(product.categoryId));

        if (isPizza) {
            // Try to find matching pizza by removing common prefixes/suffixes
            let pName = product.name.toUpperCase().replace("PIZZA", "").trim();
            pName = pName.replace(" (33CM)", "").replace(" (45CM)", ""); // Just in case it's in the name

            // Some special exceptions
            if (product.name.toUpperCase().includes('KEBAB PIZZA')) pName = 'KEBAB PIZZA';
            if (product.name.toUpperCase().includes('SCHLOSS PIZZA')) pName = 'SCHLOSS PIZZA';
            if (product.name.toUpperCase() === 'LEMON PIZZA') pName = 'LEMON PIZZA';

            const sizesAndPrices = PIZZA_PRICES[pName];

            if (!sizesAndPrices) {
                // Fallback exact match if it still contains pizza implicitly in the name
                const exactMatch = Object.keys(PIZZA_PRICES).find(k => product.name.toUpperCase().includes(k) && k !== 'PIZZA');

                if (exactMatch) {
                    console.log(`Matched using fallback: ${product.name} -> ${exactMatch}`);
                    const fbSizes = PIZZA_PRICES[exactMatch];
                    await updatePizzaVariants(product, fbSizes);
                    updatedCount++;
                } else {
                    console.warn(`WARNING: Could not find matching prices for pizza: "${product.name}" (Extracted: "${pName}")`);
                    notFoundCount++;

                    // Generate a default 33cm size with same price and a 45cm size with +10 CHF just to make it work
                    const fallbackSizes = { price33: Number(product.price), price45: Number(product.price) + 10 };
                    console.log(`Falling back to default sizing logic: 33cm = ${fallbackSizes.price33}, 45cm = ${fallbackSizes.price45}`);
                    await updatePizzaVariants(product, fallbackSizes);
                    updatedCount++;
                }
            } else {
                await updatePizzaVariants(product, sizesAndPrices);
                updatedCount++;
            }
        }
    }

    console.log(`\nPatch complete! Successfully updated ${updatedCount} pizzas.`);
    if (notFoundCount > 0) {
        console.log(`${notFoundCount} pizzas used the fallback default sizing.`);
    }
}

async function updatePizzaVariants(product: any, sizes: { price33: number, price45: number }) {
    const variants = [
        {
            name: "33 cm",
            sku: `${product.sku || 'SKU'}-33CM`,
            price: sizes.price33,
            stock: -1
        },
        {
            name: "45 cm",
            sku: `${product.sku || 'SKU'}-45CM`,
            price: sizes.price45,
            stock: -1
        }
    ];

    console.log(`Updating ${product.name} variants: 33cm(CHF ${sizes.price33}) / 45cm(CHF ${sizes.price45})`);

    await db.update(products)
        .set({ variants: variants })
        .where(eq(products.id, product.id));
}

patchPizzaSizes().catch(console.error).finally(() => process.exit(0));
