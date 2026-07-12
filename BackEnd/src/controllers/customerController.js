import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Transaction } from '../models/Transaction.js';
import { recalculateTransactions } from '../utils/ledger.js';

const VALID_TYPES = new Set(['credit', 'debit']);

function toMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function parsePositiveAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return toMoney(n);
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const toClientCustomer = (customerDoc, transactions = []) => ({
  id: String(customerDoc._id),
  name: customerDoc.name,
  phone: customerDoc.phone || '',
  area: customerDoc.area || '',
  balance: customerDoc.balance || 0,
  lastActivity: customerDoc.lastActivity ? new Date(customerDoc.lastActivity).toISOString() : new Date().toISOString(),
  lastReminded: customerDoc.lastReminded ? new Date(customerDoc.lastReminded).toISOString() : null,
  firstReminderAt: customerDoc.firstReminderAt ? new Date(customerDoc.firstReminderAt).toISOString() : null,
  reminderCount: customerDoc.reminderCount || 0,
  transactions: transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    note: tx.note || '',
    date: new Date(tx.date).toISOString(),
    balance: tx.balance,
  })),
});

/** Clean insert docs — never spread Mongoose documents (object spread drops `type`). */
function toInsertDocs(transactions, customerId, ownerId) {
  return transactions.map((tx) => ({
    id: String(tx.id),
    type: tx.type,
    amount: tx.amount,
    note: tx.note || '',
    date: new Date(tx.date),
    balance: tx.balance,
    customerId,
    ownerId,
  }));
}

async function replaceCustomerTransactions(customerId, ownerId, nextTransactions) {
  const inserts = toInsertDocs(nextTransactions, customerId, ownerId);
  await Transaction.deleteMany({ customerId, ownerId });
  if (inserts.length > 0) {
    await Transaction.insertMany(inserts);
  }
}

export async function listCustomers(req, res) {
  try {
    // List customers WITHOUT transactions (huge performance boost)
    const docs = await Customer.find({ ownerId: req.user.id }).sort({ updatedAt: -1 });
    return res.json({ customers: docs.map(doc => toClientCustomer(doc, [])) });
  } catch {
    return res.status(500).json({ message: 'Failed to fetch customers' });
  }
}

export async function getCustomer(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const customer = await Customer.findOne({ _id: id, ownerId: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    // Fetch transactions on demand
    const txns = await Transaction.find({ customerId: customer._id, ownerId: req.user.id }).sort({ date: 1 });
    return res.json({ customer: toClientCustomer(customer, txns) });
  } catch {
    return res.status(500).json({ message: 'Failed to fetch customer' });
  }
}

export async function createCustomer(req, res) {
  try {
    const { name, phone = '', area = '' } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const customer = await Customer.create({
      ownerId: req.user.id,
      name: String(name).trim(),
      phone: String(phone).trim(),
      area: String(area).trim(),
      balance: 0,
      lastActivity: new Date(),
      reminderCount: 0,
      lastReminded: null,
      firstReminderAt: null,
    });

    return res.status(201).json({ customer: toClientCustomer(customer, []) });
  } catch {
    return res.status(500).json({ message: 'Failed to create customer' });
  }
}

export async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const deleted = await Customer.findOneAndDelete({ _id: id, ownerId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    
    // Delete all associated transactions
    await Transaction.deleteMany({ customerId: id, ownerId: req.user.id });
    
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Failed to delete customer' });
  }
}

export async function addTransaction(req, res) {
  try {
    const { id } = req.params;
    const { type, amount, note = '', date, id: txnId } = req.body || {};
    if (!type || !VALID_TYPES.has(type)) {
      return res.status(400).json({ message: 'Transaction type must be credit or debit' });
    }
    const parsedAmount = parsePositiveAmount(amount);
    if (!parsedAmount) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }
    const parsedDate = date ? parseDateOrNull(date) : new Date();
    if (!parsedDate) {
      return res.status(400).json({ message: 'Invalid transaction date' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findOne({ _id: id, ownerId: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const nextTxnId = txnId ? String(txnId).trim() : `${customer._id}-${Date.now()}`;
    
    const existing = await Transaction.findOne({ customerId: customer._id, ownerId: req.user.id, id: nextTxnId });
    if (existing) {
      return res.status(409).json({ message: 'Transaction id already exists' });
    }

    // Fetch existing txns as plain objects (Mongoose docs break object spread)
    const txns = await Transaction.find({ customerId: customer._id, ownerId: req.user.id }).sort({ date: 1 }).lean();
    
    const nextTransactions = recalculateTransactions([
      ...txns,
      {
        id: nextTxnId,
        type,
        amount: parsedAmount,
        note: String(note || '').trim(),
        date: parsedDate,
      },
    ]);

    await replaceCustomerTransactions(customer._id, req.user.id, nextTransactions);

    customer.balance = nextTransactions.at(-1)?.balance ?? 0;
    customer.lastActivity = nextTransactions.at(-1)?.date ?? new Date();
    await customer.save();

    return res.status(201).json({ customer: toClientCustomer(customer, nextTransactions) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to add transaction' });
  }
}

export async function updateTransaction(req, res) {
  try {
    const { id, txnId } = req.params;
    const { type, amount, note, date } = req.body || {};

    if (type && !VALID_TYPES.has(type)) {
      return res.status(400).json({ message: 'Transaction type must be credit or debit' });
    }
    if (amount !== undefined && !parsePositiveAmount(amount)) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }
    if (date !== undefined && !parseDateOrNull(date)) {
      return res.status(400).json({ message: 'Invalid transaction date' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findOne({ _id: id, ownerId: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const txns = await Transaction.find({ customerId: customer._id, ownerId: req.user.id }).sort({ date: 1 }).lean();
    const exists = txns.some((tx) => tx.id === txnId);
    if (!exists) return res.status(404).json({ message: 'Transaction not found' });

    const nextTransactions = recalculateTransactions(txns.map((tx) => {
      if (tx.id !== txnId) return tx;
      return {
        ...tx,
        type: type || tx.type,
        amount: amount !== undefined ? parsePositiveAmount(amount) : tx.amount,
        note: note !== undefined ? String(note || '').trim() : tx.note,
        date: date ? parseDateOrNull(date) : tx.date,
      };
    }));

    await replaceCustomerTransactions(customer._id, req.user.id, nextTransactions);

    customer.balance = nextTransactions.at(-1)?.balance ?? 0;
    customer.lastActivity = nextTransactions.at(-1)?.date ?? new Date();
    await customer.save();
    
    return res.json({ customer: toClientCustomer(customer, nextTransactions) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update transaction' });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id, txnId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const customer = await Customer.findOne({ _id: id, ownerId: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const txns = await Transaction.find({ customerId: customer._id, ownerId: req.user.id }).sort({ date: 1 }).lean();
    const exists = txns.some((tx) => tx.id === txnId);
    if (!exists) return res.status(404).json({ message: 'Transaction not found' });

    const nextTransactions = recalculateTransactions(txns.filter((tx) => tx.id !== txnId));
    
    await replaceCustomerTransactions(customer._id, req.user.id, nextTransactions);

    customer.balance = nextTransactions.at(-1)?.balance ?? 0;
    customer.lastActivity = nextTransactions.at(-1)?.date || customer.lastActivity || new Date();
    await customer.save();

    return res.json({ customer: toClientCustomer(customer, nextTransactions) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete transaction' });
  }
}

export async function markCustomerReminder(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const customer = await Customer.findOne({ _id: id, ownerId: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const now = new Date();
    customer.firstReminderAt = customer.firstReminderAt || now;
    customer.lastReminded = now;
    customer.reminderCount = (customer.reminderCount || 0) + 1;
    await customer.save();

    return res.json({ customer: toClientCustomer(customer, []) });
  } catch {
    return res.status(500).json({ message: 'Failed to update reminder status' });
  }
}

export async function markBulkReminders(req, res) {
  try {
    const ids = Array.isArray(req.body?.customerIds) ? req.body.customerIds.map(String) : [];
    if (!ids.length) {
      return res.status(400).json({ message: 'customerIds is required' });
    }
    if (ids.length > 100) {
      return res.status(400).json({ message: 'You can remind at most 100 customers at once' });
    }

    const now = new Date();
    await Customer.updateMany(
      { _id: { $in: ids }, ownerId: req.user.id },
      { 
        $set: { lastReminded: now },
        $inc: { reminderCount: 1 } 
      }
    );

    await Customer.updateMany(
      { _id: { $in: ids }, ownerId: req.user.id, firstReminderAt: null },
      { $set: { firstReminderAt: now } }
    );

    const docs = await Customer.find({ _id: { $in: ids }, ownerId: req.user.id });
    return res.json({ customers: docs.map(doc => toClientCustomer(doc, [])) });
  } catch {
    return res.status(500).json({ message: 'Failed to update reminder status' });
  }
}
