import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Cart routes
router.get('/', authMiddleware, (req, res) => res.json({ message: 'Get cart' }));
router.post('/items', authMiddleware, (req, res) => res.json({ message: 'Add to cart' }));
router.put('/items/:id', authMiddleware, (req, res) => res.json({ message: 'Update cart item' }));
router.delete('/items/:id', authMiddleware, (req, res) => res.json({ message: 'Remove from cart' }));
router.delete('/', authMiddleware, (req, res) => res.json({ message: 'Clear cart' }));

export default router;
