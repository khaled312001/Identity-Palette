import * as cheerio from 'cheerio';
import { db, pool } from '../server/db.js';
import { tenants, licenseKeys, categories, products, employees, superAdmins } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

const BASE_URL = 'https://pizzalemon.ch/lemon';

async function scrapeProductsForCategory(categoryUrl: string) {
    const response = await fetch(categoryUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const items: { name: string; price: number; image: string; description: string }[] = [];

    $('.product-thumb').each((i, el) => {
        const name = $(el).find('h4').text().replace(/\s+/g, ' ').trim();
        const desc = $(el).find('.product-desc').text().replace(/\s+/g, ' ').trim();

        // Price extraction
        let priceStr = $(el).find('[id^="price_old"]').text().trim() || $(el).find('.price').text().trim();
        // remove any 'CHF' or non-numeric except dot
        priceStr = priceStr.replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr) || 0;

        let img = $(el).find('.image img').attr('src') || '';
        if (img && !img.startsWith('http')) {
            img = BASE_URL + '/' + img.replace(/^\//, '');
        }

        if (name && price > 0) {
            items.push({ name, price, image: img, description: desc });
        }
    });

    return items;
}

async function run() {
    console.log("Starting Pizza Lemon Scraper & Seeder...");

    // 1. Setup Tenant
    const tenantEmail = "info@pizzalemon.ch";

    let tenant = await db.query.tenants.findFirst({
        where: eq(tenants.ownerEmail, tenantEmail)
    });

    if (!tenant) {
        console.log("Creating new tenant...");
        const hashedPassword = await bcrypt.hash("lemon1234", 10);
        const [newTenant] = await db.insert(tenants).values({
            businessName: "Pizza Lemon",
            ownerName: "Lemon Admin",
            ownerEmail: tenantEmail,
            passwordHash: hashedPassword,
            maxBranches: 1,
            maxEmployees: 10,
            storeType: "restaurant",
            status: "active"
        }).returning();
        tenant = newTenant;

        // License Key
        const key = `LEMON-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await db.insert(licenseKeys).values({
            licenseKey: key,
            tenantId: tenant.id,
            status: "active",
            notes: "Generated automatically via scraper script"
        });
        console.log(`Generated License Key: ${key}`);

        // Employees
        await db.insert(employees).values([
            {
                name: "Lemon Admin",
                email: tenantEmail,
                pin: "1234",
                role: "admin",
                isActive: true,
                permissions: ["admin", "pos", "reports", "settings"]
            },
            {
                name: "Lemon Cashier",
                pin: "0000",
                role: "cashier",
                isActive: true,
                permissions: ["pos"]
            }
        ]);
    } else {
        console.log("Pizza Lemon tenant already exists id:", tenant.id);
    }

    // 2. Scrape Categories
    console.log("Scraping categories...");
    const menuUrl = 'https://pizzalemon.ch/lemon/index.php?route=product/category&path=20';
    const response = await fetch(menuUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const cats: { name: string; url: string }[] = [];
    $('a.list-group-item').each((i, el) => {
        const name = $(el).text().replace(/-.*/g, '').trim(); // "Pizza - 24" -> "Pizza"
        const link = $(el).attr('href');
        if (name && link && !cats.find(c => c.name === name)) {
            cats.push({ name, url: link });
        }
    });
    console.log(`Found ${cats.length} categories on the sidebar.`);

    for (const cat of cats) {
        // create category if not exist
        let category = await db.query.categories.findFirst({
            where: eq(categories.name, cat.name)
        });

        if (!category) {
            const [newCat] = await db.insert(categories).values({
                name: cat.name,
                isActive: true,
                color: "#f39c12", // generic orange
                icon: "pizza"
            }).returning();
            category = newCat;
            console.log(`Created Category: ${cat.name}`);
        }

        console.log(`Scraping products for: ${cat.name} -> ${cat.url}`);
        const items = await scrapeProductsForCategory(cat.url);

        let insertedProducts = 0;
        for (const item of items) {
            // check if product exists for this tenant
            const existing = await db.query.products.findFirst({
                where: (products, { eq, and }) => and(
                    eq(products.name, item.name),
                    eq(products.tenantId, tenant!.id)
                )
            });

            if (!existing) {
                await db.insert(products).values({
                    tenantId: tenant.id,
                    categoryId: category.id,
                    name: item.name,
                    description: item.description || undefined,
                    price: item.price.toString(),
                    costPrice: (Math.max(item.price * 0.4, 1)).toString(), // placeholder cost
                    image: item.image || undefined,
                    unit: "piece",
                    taxable: true,
                    trackInventory: false,
                    isActive: true
                });
                insertedProducts++;
            }
        }
        console.log(`Inserted ${insertedProducts} new products for category ${cat.name}.`);

        // small delay to not overload server
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("Scraping and Seeding completed successfully!");

    // Close pool to allow script to exit
    await pool.end();
}

run().catch(e => {
    console.error("Error during scraping:", e);
    pool.end();
    process.exit(1);
});
