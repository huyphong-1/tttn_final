import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to parse query filters
const buildProductFilters = (query) => {
  const filters = {};
  const { 
    category, categories, inCategory, condition, brand, brands,
    priceGte, priceLte, ratingGte, featured, isSale, isTrending, 
    isBestSeller, keyword, isActive
  } = query;

  // Active/deleted filter
  if (isActive !== 'false') {
    filters.deleted_at = null;
  }

  // Condition filter (most selective)
  if (condition) {
    filters.condition = condition;
  }

  // Category filters
  if (category) {
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

  // Price range
  if (priceGte || priceLte) {
    filters.price = {};
    if (priceGte) filters.price.gte = parseFloat(priceGte);
    if (priceLte) filters.price.lte = parseFloat(priceLte);
  }

  // Rating filter
  if (ratingGte) {
    filters.rating = { gte: parseFloat(ratingGte) };
  }

  // Text search (least selective)
  if (keyword?.trim()) {
    const searchTerm = keyword.trim();
    filters.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { brand: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }

  return filters;
};

// Helper function to expand category variants (phone/phones etc)
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

// GET /api/products - List products with filters, pagination, sorting
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      orderBy = 'created_at',
      ascending = 'false',
      fields,
      count
    } = req.query;

    const filters = buildProductFilters(req.query);
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

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

    res.json({
      data: products,
      count: totalCount,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: totalCount ? Math.ceil(totalCount / parseInt(pageSize)) : null
      }
    });

  } catch (error) {
    console.error('[Products API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ data: product });

  } catch (error) {
    console.error('[Products API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/search - Search products (for navbar autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 6 } = req.query;

    if (!q?.trim()) {
      return res.json({ data: [] });
    }

    const searchTerm = q.trim();
    const products = await prisma.product.findMany({
      where: {
        deleted_at: null,
        condition: 'new',
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit)
    });

    res.json({ data: products });

  } catch (error) {
    console.error('[Products Search API] Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('[Products API] Update request:', { id, updateData });
    
    // Remove undefined/null values
    const cleanData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        cleanData[key] = updateData[key];
      }
    });
    
    console.log('[Products API] Clean data:', cleanData);
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: cleanData
    });
    
    console.log('[Products API] Update success:', { id: updatedProduct.id });
    
    res.json({ data: updatedProduct });
    
  } catch (error) {
    console.error('[Products API] Update Error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    
    console.log('[Products API] Create request:', productData);
    
    // Remove undefined/null values
    const cleanData = {};
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined && productData[key] !== null) {
        cleanData[key] = productData[key];
      }
    });
    
    console.log('[Products API] Clean create data:', cleanData);
    
    // Create product
    const newProduct = await prisma.product.create({
      data: cleanData
    });
    
    console.log('[Products API] Create success:', { id: newProduct.id });
    
    res.json({ data: newProduct });
    
  } catch (error) {
    console.error('[Products API] Create Error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[Products API] Delete request:', { id });
    
    // Soft delete by setting deleted_at
    const deletedProduct = await prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
    
    console.log('[Products API] Delete success:', { id: deletedProduct.id });
    
    res.json({ data: deletedProduct });
    
  } catch (error) {
    console.error('[Products API] Delete Error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Helper function to parse select fields
const parseSelectFields = (fields) => {
  if (fields === '*') return undefined;
  
  const fieldList = fields.split(',').map(f => f.trim());
  const select = {};
  fieldList.forEach(field => {
    select[field] = true;
  });
  return select;
};

export default router;
