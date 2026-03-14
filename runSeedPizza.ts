
import { seedPizzaLemon } from "./server/seedPizzaLemon";

async function main() {
    try {
        await seedPizzaLemon();
        console.log("Pizza Lemon seeding process finished.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

main();
