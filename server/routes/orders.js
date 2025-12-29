import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/orders - Get user orders with pagination
router.get('/', async (req, res) => {
  try {
    const { 
      user_id, 
      page = 1, 
      pageSize = 10, 
      status,
      payment_status,
      orderBy = 'created_at',
      ascending = 'false'
    } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const filters = { user_id };
    if (status) filters.status = status;
    if (payment_status) filters.payment_status = payment_status;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const orderByClause = {};
    orderByClause[orderBy] = ascending === 'true' ? 'asc' : 'desc';

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: filters,
        include: {
          order_items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  brand: true
                }
              }
            }
          }
        },
        orderBy: orderByClause,
        skip,
        take
      }),
      prisma.order.count({ where: filters })
    ]);

    res.json({
      data: orders,
      count: totalCount,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / parseInt(pageSize))
      }
    });

  } catch (error) {
    console.error('[Orders API] Get Error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get single order with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    const order = await prisma.order.findFirst({
      where: { 
        id,
        ...(user_id && { user_id }) // Optional user filter for security
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        order_items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ data: order });

  } catch (error) {
    console.error('[Orders API] Get Single Error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      total_amount,
      payment_method,
      shipping_address,
      notes,
      order_items
    } = req.body;

    if (!user_id || !total_amount || !order_items?.length) {
      return res.status(400).json({ 
        error: 'user_id, total_amount, and order_items are required' 
      });
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          user_id,
          total_amount: parseFloat(total_amount),
          payment_method,
          shipping_address,
          notes,
          status: 'pending',
          payment_status: 'pending'
        }
      });

      // Create order items
      const orderItemsData = order_items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      }));

      await tx.orderItem.createMany({
        data: orderItemsData
      });

      // Return order with items
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          order_items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  brand: true
                }
              }
            }
          }
        }
      });
    });

    res.status(201).json({ data: order });

  } catch (error) {
    console.error('[Orders API] Create Error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    const order = await prisma.order.update({
      where: { id },
      data: updateData
    });

    res.json({ data: order });

  } catch (error) {
    console.error('[Orders API] Update Status Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/orders/stats/:user_id - Get order statistics for user
router.get('/stats/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: { user_id },
      _count: { status: true },
      _sum: { total_amount: true }
    });

    const totalOrders = await prisma.order.count({ 
      where: { user_id } 
    });

    const totalSpent = await prisma.order.aggregate({
      where: { 
        user_id,
        payment_status: 'completed'
      },
      _sum: { total_amount: true }
    });

    res.json({
      data: {
        total_orders: totalOrders,
        total_spent: totalSpent._sum.total_amount || 0,
        by_status: stats
      }
    });

  } catch (error) {
    console.error('[Orders API] Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

export default router;
