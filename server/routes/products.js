import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();

// ✅ Prisma singleton (quan trọng cho Vercel / serverless)
const globalForPrisma = globalThis;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper function to expand category variants (phone/phones etc)
const expandCategoryVariants = (categories) => {
  const result = new Set();
  categories.forEach((cat) => {
    const lower = String(cat || "").toLowerCase().trim();
    if (!lower) return;
    result.add(lower);

    if (lower.endsWith("s")) result.add(lower.slice(0, -1));
    else result.add(lower + "s");
  });
  return Array.from(result);
};

// Helper function to parse select fields
const parseSelectFields = (fields) => {
  if (!fields || fields === "*") return undefined;
  const fieldList = String(fields)
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const select = {};
  fieldList.forEach((field) => {
    select[field] = true;
  });
  return select;
};

// Helper function to parse query filters
const buildProductFilters = (query) => {
  const filters = {};
  const {
    category,
    categories,
    inCategory,
    condition,
    brand,
    brands,
    priceGte,
    priceLte,
    ratingGte,
    featured,
    isSale,
    isTrending,
    isBestSeller,
    keyword,
    isActive,
  } = query;

  // Active/deleted filter
  if (isActive !== "false") {
    filters.deleted_at = null;
  }

  // Condition filter (most selective)
  if (condition) {
    filters.condition = condition;
  }

  // Category filters
  if (category) {
    filters.category = { in: expandCategoryVariants([category]) };
  } else if (categories) {
    const categoryList = Array.isArray(categories) ? categories : String(categories).split(",");
    filters.category = { in: expandCategoryVariants(categoryList) };
  } else if (inCategory) {
    const categoryList = Array.isArray(inCategory) ? inCategory : String(inCategory).split(",");
    filters.category = { in: expandCategoryVariants(categoryList) };
  }

  // Brand filters
  if (brand && brand !== "all") {
    filters.brand = brand;
  } else if (brands) {
    const brandList = Array.isArray(brands) ? brands : String(brands).split(",");
    filters.brand = { in: brandList };
  }

  // Feature flags
  if (featured === "true") filters.featured = true;
  if (isSale === "true") filters.is_sale = true;
  if (isTrending === "true") filters.is_trending = true;
  if (isBestSeller === "true") filters.is_best_seller = true;

  // Price range
  if (priceGte || priceLte) {
    filters.price = {};
    if (priceGte) filters.price.gte = Number(priceGte);
    if (priceLte) filters.price.lte = Number(priceLte);
  }

  // Rating filter
  if (ratingGte) {
    filters.rating = { gte: Number(ratingGte) };
  }

  // Text search (least selective)
  if (keyword?.trim()) {
    const searchTerm = keyword.trim();
    filters.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { brand: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  return filters;
};

// ✅ GET /api/products/search - đặt TRƯỚC /:id để không bị nuốt route
router.get("/search", async (req, res) => {
  try {
    const { q, limit = 6 } = req.query;

    if (!q?.trim()) {
      return res.json({ data: [] });
    }

    const searchTerm = q.trim();
    const products = await prisma.product.findMany({
      where: {
        deleted_at: null,
        condition: "new",
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { brand: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true,
      },
      orderBy: { created_at: "desc" },
      take: Number(limit) || 6,
    });

    res.json({ data: products });
  } catch (error) {
    console.error("[Products Search API] Error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /api/products - List products with filters, pagination, sorting
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      orderBy = "created_at",
      ascending = "false",
      fields,
      count,
    } = req.query;

    const filters = buildProductFilters(req.query);

    const pageNum = Math.max(1, Number(page) || 1);
    const sizeNum = Math.max(1, Number(pageSize) || 12);

    // Pagination
    const skip = (pageNum - 1) * sizeNum;
    const take = sizeNum;

    // Sorting
    const orderByClause = { [orderBy]: ascending === "true" ? "asc" : "desc" };

    // Select fields
    const select = fields ? parseSelectFields(fields) : undefined;

    const shouldCount = count !== "null";

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        select,
        orderBy: orderByClause,
        skip,
        take,
      }),
      shouldCount ? prisma.product.count({ where: filters }) : Promise.resolve(null),
    ]);

    res.json({
      data: products,
      count: totalCount,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        totalPages: totalCount ? Math.ceil(totalCount / sizeNum) : null,
      },
    });
  } catch (error) {
    console.error("[Products API] Error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ GET /api/products/:id - Get single product (đặt SAU /search)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ data: product });
  } catch (error) {
    console.error("[Products API] Error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// PUT /api/products/:id - Update product
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const cleanData = {};
    Object.keys(updateData || {}).forEach((key) => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        cleanData[key] = updateData[key];
      }
    });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: cleanData,
    });

    res.json({ data: updatedProduct });
  } catch (error) {
    console.error("[Products API] Update Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(500).json({ error: "Failed to update product" });
  }
});

// POST /api/products - Create new product
router.post("/", async (req, res) => {
  try {
    const productData = req.body;

    const cleanData = {};
    Object.keys(productData || {}).forEach((key) => {
      if (productData[key] !== undefined && productData[key] !== null) {
        cleanData[key] = productData[key];
      }
    });

    const newProduct = await prisma.product.create({
      data: cleanData,
    });

    res.json({ data: newProduct });
  } catch (error) {
    console.error("[Products API] Create Error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// DELETE /api/products/:id - Delete product (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ data: deletedProduct });
  } catch (error) {
    console.error("[Products API] Delete Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
