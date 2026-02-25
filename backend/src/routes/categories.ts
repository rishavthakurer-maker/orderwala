import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ message: 'Get all categories' }));
router.get('/:id', (req, res) => res.json({ message: 'Get category' }));
router.get('/:id/products', (req, res) => res.json({ message: 'Get products by category' }));

export default router;
