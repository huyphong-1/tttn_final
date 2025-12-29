import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // GET /api/products/:id - Get single product
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json(product);

    } else if (req.method === 'PUT') {
      // PUT /api/products/:id - Update product
      const updateData = req.body;
      
      console.log('[Products API] Updating product:', { id, data: updateData });

      const product = await prisma.product.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          price: updateData.price,
          category: updateData.category,
          stock: updateData.stock,
          image: updateData.image,
          brand: updateData.brand,
          specifications: updateData.specifications,
          discount: updateData.discount || 0,
          featured: updateData.featured || false,
          status: updateData.status || 'active'
        }
      });

      console.log('[Products API] Update success:', { id: product.id });
      return res.json(product);

    } else if (req.method === 'DELETE') {
      // DELETE /api/products/:id - Delete product
      console.log('[Products API] Deleting product:', { id });

      await prisma.product.delete({
        where: { id }
      });

      console.log('[Products API] Delete success:', { id });
      return res.json({ message: 'Product deleted successfully' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[Products API] Error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    return res.status(500).json({ error: 'Failed to process request' });
  } finally {
    await prisma.$disconnect();
  }
}
