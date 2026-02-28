import { db } from "./server/db";
import { licenseKeys, tenants } from "./shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

async function main() {
    const licenseKey = "BARMAGLY-39D4-EDB2-3D44-DD98";
    const email = "info@pizzalemon.ch";
    const password = "password123"; // wait, the screenshot has 8 dots '........', wait what password?

    // Let's emulate what the backend does
    console.log(`Checking license: ${licenseKey}`);
    const [license] = await db.select().from(licenseKeys).where(eq(licenseKeys.licenseKey, licenseKey));
    if (!license) {
        console.log("License not found. VALIDATION FAILED");
        return;
    }
    console.log("License found:", license);

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, license.tenantId));
    if (!tenant) {
        console.log("Tenant not found.");
        return;
    }
    console.log("Tenant found:", tenant.ownerEmail);

    if (tenant.ownerEmail.toLowerCase() !== email.toLowerCase()) {
        console.log(`Email mismatch: DB has ${tenant.ownerEmail}, input has ${email}`);
    }

    process.exit(0);
}

main().catch(console.error);
