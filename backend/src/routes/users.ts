import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, (req, res) => res.json({ message: 'Get user profile' }));
router.put('/profile', authMiddleware, (req, res) => res.json({ message: 'Update profile' }));
router.get('/addresses', authMiddleware, (req, res) => res.json({ message: 'Get addresses' }));
router.post('/addresses', authMiddleware, (req, res) => res.json({ message: 'Add address' }));
router.delete('/addresses/:id', authMiddleware, (req, res) => res.json({ message: 'Delete address' }));
router.post('/change-password', authMiddleware, (req, res) => res.json({ message: 'Change password' }));

export default router;
