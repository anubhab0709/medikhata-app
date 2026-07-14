import { Router } from 'express';
import {
  addTransaction,
  createCustomer,
  deleteCustomer,
  deleteTransaction,
  ensureCustomerShareLink,
  getCustomer,
  getDashboardSummary,
  listCustomers,
  markBulkReminders,
  markCustomerReminder,
  updateCustomer,
  updateTransaction,
} from '../controllers/customerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', listCustomers);
router.get('/dashboard-summary', getDashboardSummary);
router.post('/reminders/mark-bulk', markBulkReminders);
router.post('/', createCustomer);
router.post('/:id/share-link', ensureCustomerShareLink);
router.post('/:id/reminders/mark', markCustomerReminder);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

router.post('/:id/transactions', addTransaction);
router.put('/:id/transactions/:txnId', updateTransaction);
router.delete('/:id/transactions/:txnId', deleteTransaction);

export default router;
