import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

const SRC_DIR = path.join(process.cwd(), "img");
const DEST_DIR = path.join(process.cwd(), "public", "products");

const slugify = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();

const copyImages = () => {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Missing source folder: ${SRC_DIR}`);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

  const copied = new Set();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, path.extname(file));
    const slug = slugify(base);
    const destName = `${slug}${ext}`;
    const srcPath = path.join(SRC_DIR, file);
    const destPath = path.join(DEST_DIR, destName);

    fs.copyFileSync(srcPath, destPath);
    copied.add(destName);
  }

  return copied;
};

const filterAvailable = (list, available, fallback) => {
  const filtered = list.filter((name) => available.has(name));
  if (filtered.length > 0) return filtered;
  return available.has(fallback) ? [fallback] : [];
};

const run = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL env var is required");
  }

  const available = copyImages();
  const fallbackImage = "download.png";

  const phoneImages = filterAvailable(
    [
      "iphone-13-128gb.png",
      "iphone-14-pro-max-256gb.png",
      "iphone-15-pro-128gb.png",
      "iphone-15-pro-max-256gb.png",
      "google-pixel-8-128gb.png",
      "google-pixel-8-pro-256gb.png",
      "asus-rog-phone-8-256gb.png",
    ],
    available,
    fallbackImage
  );

  const tabletImages = filterAvailable(
    [
      "ipad-air-5-64gb-wifi.png",
      "ipad-pro-11-m2-128gb.png",
      "galaxy-tab-s9-256gb.png",
    ],
    available,
    fallbackImage
  );

  const accessoryImages = filterAvailable(
    [
      "adnker-20w.png",
      "chuot-khong-day-logitech-pebble.png",
      "cap-lightning-mfi-1m.png",
      "cap-sac-3-in-1.png",
      "cap-usb-c-to-usb-c-100w-baseus-1m.png",
      "cu-sac-gan-65w-2-cong.png",
      "cu-sac-samsung-25w-chinh-hang.png",
      "gia-o-ien-thoai-o-to-kep-cua-gio.png",
      "gay-selfie-tripod-bluetooth.png",
      "hub-usb-c-6-in-1.png",
      "download.png",
    ],
    available,
    fallbackImage
  );

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const { rows } = await client.query(
    "select id, category from public.products order by created_at asc, id asc"
  );

  const counters = {
    phone: 0,
    tablet: 0,
    accessory: 0,
    other: 0,
  };

  for (const row of rows) {
    const category = row.category || "other";
    let list = [];
    if (category === "phone") list = phoneImages;
    else if (category === "tablet") list = tabletImages;
    else if (category === "accessory") list = accessoryImages;
    else list = available.has(fallbackImage) ? [fallbackImage] : [];

    if (list.length === 0) continue;

    const index = counters[category] || 0;
    const imageName = list[index % list.length];
    counters[category] = index + 1;

    const imagePath = `/products/${imageName}`;
    await client.query("update public.products set image = $1 where id = $2", [
      imagePath,
      row.id,
    ]);
  }

  await client.end();
  console.log("Copied images to", DEST_DIR);
  console.log("Updated products:", counters);
};

run().catch((err) => {
  console.error("Import failed:", err.message);
  process.exitCode = 1;
});
