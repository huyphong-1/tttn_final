import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const client = new Client({ connectionString });

const statements = [
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications TEXT`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new'`,
  `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`,
  `ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'active'`,
  `ALTER TABLE public.products ALTER COLUMN condition SET DEFAULT 'new'`,
  `UPDATE public.products SET status = 'active' WHERE status IS NULL`,
  `UPDATE public.products SET condition = 'new' WHERE condition IS NULL`,
  `UPDATE public.products SET view_count = 0 WHERE view_count IS NULL`,
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'products_status_check'
     ) THEN
       ALTER TABLE public.products
         ADD CONSTRAINT products_status_check CHECK (status IN ('active','inactive'));
     END IF;
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'products_condition_check'
     ) THEN
       ALTER TABLE public.products
         ADD CONSTRAINT products_condition_check CHECK (condition IN ('new','used'));
     END IF;
   END $$;`
];

(async () => {
  try {
    await client.connect();
    for (const sql of statements) {
      await client.query(sql);
    }
    console.log("Schema updated successfully");
  } catch (err) {
    console.error("Migration failed", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
