const { Pool } = require('pg');
const { addDays, addMonths } = require('date-fns');

const connectionString = "postgresql://neondb_owner:npg_eMqwIhUg8p2G@ep-long-sound-ajwt8qyz.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

async function seed() {
    console.log('[SIMPLE-SEED] Starting with schema fix...');
    try {
        // Fix Schema if needed
        console.log('[SIMPLE-SEED] Ensuring tenant_id columns exist...');
        const tablesToFix = ['branches', 'products', 'employees', 'sales', 'inventory', 'customers', 'suppliers'];
        for (const table of tablesToFix) {
            try {
                await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tenant_id integer`);
                console.log(`[SIMPLE-SEED] Table ${table}: tenant_id ensured.`);
            } catch (e) {
                console.log(`[SIMPLE-SEED] Table ${table}: Note - ${e.message}`);
            }
        }

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const pick = (arr) => arr[rand(0, arr.length - 1)];

        // Super Admin
        await pool.query(`
            INSERT INTO super_admins (name, email, password_hash, role, is_active)
            VALUES ('System Admin', 'admin@barmagly.com', 'admin123', 'super_admin', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = 'admin123'
        `);
        console.log('[SIMPLE-SEED] Super Admin ensured.');

        // Tenants
        let allTenants = (await pool.query('SELECT * FROM tenants')).rows;
        if (allTenants.length === 0) {
            console.log('[SIMPLE-SEED] Creating a demo tenant...');
            const tRes = await pool.query(`
                INSERT INTO tenants (business_name, owner_name, owner_email, password_hash, status)
                VALUES ('Demo Store', 'Demo Owner', 'demo@store.com', 'admin123', 'active')
                RETURNING *
            `);
            allTenants = tRes.rows;
        }

        for (const t of allTenants) {
            console.log(`[SIMPLE-SEED] Seeding tenant: ${t.business_name}`);

            // Branches
            let branches = (await pool.query('SELECT * FROM branches WHERE tenant_id = $1', [t.id])).rows;
            if (branches.length === 0) {
                const res = await pool.query(`INSERT INTO branches (tenant_id, name, is_active, is_main) VALUES ($1, 'Main Branch', true, true) RETURNING *`, [t.id]);
                branches = res.rows;
            }
            const branchIds = branches.map(b => b.id);

            // Employees
            let employees = (await pool.query('SELECT * FROM employees WHERE branch_id = ANY($1)', [branchIds])).rows;
            if (employees.length === 0) {
                await pool.query(`INSERT INTO employees (name, pin, role, branch_id, is_active) VALUES ('Manager', '1234', 'admin', $1, true)`, [branchIds[0]]);
                employees = (await pool.query('SELECT * FROM employees WHERE branch_id = ANY($1)', [branchIds])).rows;
            }
            const employeeIds = employees.map(e => e.id);

            // Categories
            const catsExist = await pool.query('SELECT count(*) FROM categories');
            if (parseInt(catsExist.rows[0].count) < 2) {
                await pool.query(`INSERT INTO categories (name, name_ar, color, icon, is_active) VALUES ('Food', 'طعام', '#EF4444', 'utensils', true) ON CONFLICT DO NOTHING`);
                await pool.query(`INSERT INTO categories (name, name_ar, color, icon, is_active) VALUES ('Beverages', 'مشروبات', '#3B82F6', 'coffee', true) ON CONFLICT DO NOTHING`);
            }
            const categories = (await pool.query('SELECT * FROM categories')).rows;

            // Products
            let products = (await pool.query('SELECT * FROM products WHERE tenant_id = $1', [t.id])).rows;
            if (products.length === 0) {
                for (const cat of categories) {
                    await pool.query(`INSERT INTO products (tenant_id, name, price, category_id, is_active, sku) VALUES ($1, $2, $3, $4, true, $5)`, 
                        [t.id, 'Demo ' + cat.name, '10.00', cat.id, 'SKU-' + t.id + '-' + cat.id]);
                }
                products = (await pool.query('SELECT * FROM products WHERE tenant_id = $1', [t.id])).rows;
            }
            const productIds = products.map(p => p.id);

            // Sales
            const salesCount = await pool.query('SELECT count(*) FROM sales WHERE branch_id = ANY($1)', [branchIds]);
            if (parseInt(salesCount.rows[0].count) < 5) {
                for (let i = 0; i < 10; i++) {
                    const bId = pick(branchIds);
                    const eId = pick(employeeIds);
                    const pId = pick(productIds);
                    const recNum = 'RCP-' + t.id + '-' + bId + '-' + Date.now() + '-' + i;
                    const saleRes = await pool.query(`
                        INSERT INTO sales (receipt_number, branch_id, employee_id, subtotal, total_amount, payment_method, status)
                        VALUES ($1, $2, $3, 10.00, 10.00, 'cash', 'completed')
                        RETURNING id
                    `, [recNum, bId, eId]);
                    await pool.query(`INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total) VALUES ($1, $2, 'Item', 1, 10.00, 10.00)`, [saleRes.rows[0].id, pId]);
                }
            }
            console.log(`[SIMPLE-SEED] Tenant ${t.id} seeded.`);
        }

        console.log('[SIMPLE-SEED] ✅ All done!');
    } catch (err) {
        console.error('[SIMPLE-SEED] ❌ ERROR:', err);
    } finally {
        await pool.end();
    }
}

seed();
