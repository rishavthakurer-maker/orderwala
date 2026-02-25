import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', (req, res) => res.json({ message: 'Get active promos' }));
router.post('/validate', authMiddleware, (req, res) => res.json({ message: 'Validate promo code' }));
router.post('/apply', authMiddleware, (req, res) => res.json({ message: 'Apply promo code' }));

export default router;
