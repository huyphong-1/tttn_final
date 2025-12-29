import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/profiles/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ data: profile });

  } catch (error) {
    console.error('[Profiles API] Get Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/profiles - Create user profile
router.post('/', async (req, res) => {
  try {
    const { id, email, full_name, role = 'user', status = 'active' } = req.body;

    const profile = await prisma.profile.create({
      data: {
        id,
        email,
        full_name,
        role,
        status
      }
    });

    res.status(201).json({ data: profile });

  } catch (error) {
    console.error('[Profiles API] Create Error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Profile already exists' });
    }
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// PUT /api/profiles/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, status, last_login } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (last_login !== undefined) updateData.last_login = new Date(last_login);

    const profile = await prisma.profile.update({
      where: { id },
      data: updateData
    });

    res.json({ data: profile });

  } catch (error) {
    console.error('[Profiles API] Update Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profiles/:id/last-login - Update last login timestamp
router.post('/:id/last-login', async (req, res) => {
  try {
    const { id } = req.params;
    const lastLogin = new Date();

    const profile = await prisma.profile.update({
      where: { id },
      data: { last_login: lastLogin }
    });

    res.json({ data: { last_login: profile.last_login } });

  } catch (error) {
    console.error('[Profiles API] Last Login Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(500).json({ error: 'Failed to update last login' });
  }
});

export default router;
