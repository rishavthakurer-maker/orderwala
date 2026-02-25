import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/razorpay/create-order', authMiddleware, (req, res) =>
  res.json({ message: 'Create Razorpay order' })
);
router.post('/razorpay/verify', authMiddleware, (req, res) =>
  res.json({ message: 'Verify Razorpay payment' })
);
router.get('/wallet', authMiddleware, (req, res) => res.json({ message: 'Get wallet' }));
router.post('/wallet/add-money', authMiddleware, (req, res) =>
  res.json({ message: 'Add money to wallet' })
);
router.get('/wallet/transactions', authMiddleware, (req, res) =>
  res.json({ message: 'Wallet transactions' })
);

export default router;
