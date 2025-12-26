import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const client = new Client({ connectionString });

const statements = [
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod'`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB`,
  `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`,
  `ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending'`
];

(async () => {
  try {
    await client.connect();
    for (const sql of statements) {
      console.log(`Running: ${sql}`);
      await client.query(sql);
    }
    console.log("Orders schema updated successfully");
  } catch (err) {
    console.error("Migration failed", err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();