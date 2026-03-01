import { config } from "dotenv";
config();
import { db } from "../server/db";
import { products, categories as cats, tenants } from "@shared/schema";
import { eq, and, notLike } from "drizzle-orm";
import fs from "fs";
import path from "path";
import https from "https";

const scrapedImages = fs.readFileSync("scraped_images.txt", "ucs2").split("\n").map(l => l.trim()).filter(Boolean);

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findBestMatch(name: string, category: string) {
    const origName = name.toLowerCase();
    let searchName = origName.replace("0.5l", "").replace("0.25l", "").replace("(flasche)", "").trim();
    const words = searchName.split(/\s+/).filter(w => w.length > 2);
    const slug = slugify(searchName);

    // 1. Exact slug match
    for (const url of scrapedImages) {
        let filename = decodeURIComponent(url.split('/').pop()!.toLowerCase().replace("-220x220", ""));
        if (filename.includes(slug) && slug.length > 3) return url;
    }

    // 2. All words match
    if (words.length > 0) {
        for (const url of scrapedImages) {
            let filename = decodeURIComponent(url.split('/').pop()!.toLowerCase());
            if (words.every(w => filename.includes(w))) return url;
        }
    }

    // 3. Any word match (longest word)
    if (words.length > 0) {
        const longest = words.sort((a, b) => b.length - a.length)[0];
        if (longest.length > 3) {
            for (const url of scrapedImages) {
                let filename = decodeURIComponent(url.split('/').pop()!.toLowerCase());
                if (filename.includes(longest)) return url;
            }
        }
    }

    return null;
}

async function downloadImage(url: string, filename: string): Promise<string> {
    const uploadDir = path.resolve(process.cwd(), "uploads", "products");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(filePath);
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(`/objects/products/${filename}`); });
            } else {
                reject(`HTTP ${response.statusCode}`);
            }
        });
        request.on('error', (err) => reject(err.message));
    });
}

async function run() {
    const [tenant] = await db.select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.ownerEmail, "admin@pizzalemon.ch"));

    if (!tenant) return console.log("Pizza Lemon tenant not found");

    const missing = await db.select({
        id: products.id,
        name: products.name,
        image: products.image,
        categoryName: cats.name,
    }).from(products)
        .leftJoin(cats, eq(products.categoryId, cats.id))
        .where(
            and(
                eq(products.tenantId, tenant.id),
                notLike(products.image, "/objects/%")
            )
        );

    console.log(`Found ${missing.length} missing images.`);

    for (const p of missing) {
        const match = findBestMatch(p.name, p.categoryName || "");
        if (!match) {
            console.log(`[STILL_MISSING] ${p.name}`);
        }
    }
}

run().catch(console.error).finally(() => process.exit(0));
