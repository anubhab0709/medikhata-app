import { Router } from 'express';
import { getPublicLedger } from '../controllers/publicLedgerController.js';

const router = Router();

router.get('/ledger/:token', getPublicLedger);

export default router;
