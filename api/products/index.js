import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to parse query filters
const buildProductFilters = (query) => {
  const filters = {};
  const { 
    category, categories, inCategory, condition, brand, brands,
    priceGte, priceLte, ratingGte, featured, isSale, isTrending, 
    isBestSeller, keyword, isActive, search
  } = query;

  // Active/deleted filter
  if (isActive !== 'false') {
    filters.deleted_at = null;
  }

  // Search functionality
  if (search || keyword) {
    const searchTerm = search || keyword;
    filters.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { brand: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }

  // Condition filter (most selective)
  if (condition) {
    filters.condition = condition;
  }

  // Category filters
  if (category && category !== 'all') {
    const variants = expandCategoryVariants([category]);
    filters.category = { in: variants };
  } else if (categories) {
    const categoryList = Array.isArray(categories) ? categories : categories.split(',');
    const variants = expandCategoryVariants(categoryList);
    filters.category = { in: variants };
  } else if (inCategory) {
    const categoryList = Array.isArray(inCategory) ? inCategory : inCategory.split(',');
    const variants = expandCategoryVariants(categoryList);
    filters.category = { in: variants };
  }

  // Brand filters
  if (brand && brand !== 'all') {
    filters.brand = brand;
  } else if (brands) {
    const brandList = Array.isArray(brands) ? brands : brands.split(',');
    filters.brand = { in: brandList };
  }

  // Feature flags
  if (featured === 'true') filters.featured = true;
  if (isSale === 'true') filters.is_sale = true;
  if (isTrending === 'true') filters.is_trending = true;
  if (isBestSeller === 'true') filters.is_best_seller = true;

  // Price range filters
  if (priceGte) filters.price = { ...filters.price, gte: parseFloat(priceGte) };
  if (priceLte) filters.price = { ...filters.price, lte: parseFloat(priceLte) };

  // Rating filter
  if (ratingGte) filters.rating = { gte: parseFloat(ratingGte) };

  return filters;
};

// Helper function to expand category variants (singular/plural)
const expandCategoryVariants = (categories) => {
  const result = new Set();
  categories.forEach(cat => {
    const lower = cat.toLowerCase().trim();
    result.add(lower);
    
    // Add singular/plural variants
    if (lower.endsWith('s')) {
      result.add(lower.slice(0, -1)); // Remove 's'
    } else {
      result.add(lower + 's'); // Add 's'
    }
  });
  return Array.from(result);
};

// Helper function to parse select fields
const parseSelectFields = (fields) => {
  if (!fields) return undefined;
  
  const fieldList = fields.split(',').map(f => f.trim());
  const select = {};
  
  fieldList.forEach(field => {
    if (field) {
      select[field] = true;
    }
  });
  
  return Object.keys(select).length > 0 ? select : undefined;
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // GET /api/products - List products with filters, pagination, sorting
      const {
        page = 1,
        pageSize = 12,
        limit = 12,
        orderBy = 'created_at',
        ascending = 'false',
        fields,
        count
      } = req.query;

      const filters = buildProductFilters(req.query);
      
      // Pagination
      const actualLimit = parseInt(limit) || parseInt(pageSize);
      const skip = (parseInt(page) - 1) * actualLimit;
      const take = actualLimit;

      // Sorting
      const orderByClause = {};
      orderByClause[orderBy] = ascending === 'true' ? 'asc' : 'desc';

      // Select fields
      const select = fields ? parseSelectFields(fields) : undefined;

      // Execute query
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where: filters,
          select,
          orderBy: orderByClause,
          skip,
          take,
        }),
        count !== 'null' ? prisma.product.count({ where: filters }) : null
      ]);

      return res.json({
        data: products,
        count: totalCount,
        pagination: {
          page: parseInt(page),
          pageSize: actualLimit,
          totalPages: totalCount ? Math.ceil(totalCount / actualLimit) : null
        }
      });

    } else if (req.method === 'POST') {
      // POST /api/products - Create new product
      const productData = req.body;
      
      console.log('[Products API] Creating product:', productData);

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock: productData.stock,
          image: productData.image,
          brand: productData.brand,
          specifications: productData.specifications,
          discount: productData.discount || 0,
          featured: productData.featured || false,
          status: productData.status || 'active'
        }
      });

      console.log('[Products API] Create success:', { id: product.id });
      return res.status(201).json(product);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[Products API] Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  } finally {
    await prisma.$disconnect();
  }
}
