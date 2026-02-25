import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/nearby-vendors', optionalAuth, (req, res) =>
  res.json({ message: 'Get nearby vendors' })
);
router.post('/distance', (req, res) => res.json({ message: 'Calculate distance' }));
router.post('/geocode', (req, res) => res.json({ message: 'Geocode address' }));
router.post('/route', (req, res) => res.json({ message: 'Get delivery route' }));

export default router;
