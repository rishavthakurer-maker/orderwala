import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/active-orders', authMiddleware, (req, res) => res.json({ message: 'Active deliveries' }));
router.get('/earnings', authMiddleware, (req, res) => res.json({ message: 'Delivery earnings' }));
router.put('/status', authMiddleware, (req, res) => res.json({ message: 'Update delivery status' }));
router.post('/location', authMiddleware, (req, res) => res.json({ message: 'Update location' }));
router.get('/history', authMiddleware, (req, res) => res.json({ message: 'Delivery history' }));

export default router;
