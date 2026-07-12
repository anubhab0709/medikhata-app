import { Router } from 'express';
import {
  addTransaction,
  createCustomer,
  deleteCustomer,
  deleteTransaction,
  getCustomer,
  getDashboardSummary,
  listCustomers,
  markBulkReminders,
  markCustomerReminder,
  updateTransaction,
} from '../controllers/customerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', listCustomers);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.delete('/:id', deleteCustomer);
router.post('/reminders/mark-bulk', markBulkReminders);
router.post('/:id/reminders/mark', markCustomerReminder);

router.post('/:id/transactions', addTransaction);
router.put('/:id/transactions/:txnId', updateTransaction);
router.delete('/:id/transactions/:txnId', deleteTransaction);

export default router;
