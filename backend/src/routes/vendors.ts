import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware, (req, res) => res.json({ message: 'Vendor dashboard' }));
router.get('/analytics', authMiddleware, (req, res) => res.json({ message: 'Vendor analytics' }));
router.put('/profile', authMiddleware, (req, res) => res.json({ message: 'Update vendor profile' }));
router.get('/earnings', authMiddleware, (req, res) => res.json({ message: 'Get earnings' }));
router.get('/orders', authMiddleware, (req, res) => res.json({ message: 'Vendor orders' }));

export default router;
