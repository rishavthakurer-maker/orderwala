import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req, res) => res.json({ message: 'Create review' }));
router.get('/', optionalAuth, (req, res) => res.json({ message: 'Get reviews' }));
router.get('/:id', optionalAuth, (req, res) => res.json({ message: 'Get review details' }));
router.put('/:id', authMiddleware, (req, res) => res.json({ message: 'Update review' }));
router.delete('/:id', authMiddleware, (req, res) => res.json({ message: 'Delete review' }));

export default router;
