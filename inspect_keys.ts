import { db } from "./server/db";
import { licenseKeys } from "./shared/schema";

async function main() {
    const keys = await db.select().from(licenseKeys);
    console.log("Found keys:", keys.length);
    for (const k of keys) {
        console.log(`ID: ${k.id} | Key: "${k.licenseKey}" | Status: ${k.status}`);
    }
    process.exit(0);
}

main().catch(console.error);
