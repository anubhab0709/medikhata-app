import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createSupportMessage } from '../controllers/supportController.js';

const router = Router();

router.use(requireAuth);
router.post('/messages', createSupportMessage);

export default router;
