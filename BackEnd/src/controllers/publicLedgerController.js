import crypto from 'crypto';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';

export function createLedgerShareToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export async function ensureCustomerShareToken(customer) {
  const existing = String(customer.ledgerShareToken || '').trim();
  if (existing) return existing;

  let token = createLedgerShareToken();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const updated = await Customer.findOneAndUpdate(
        {
          _id: customer._id,
          $or: [
            { ledgerShareToken: null },
            { ledgerShareToken: { $exists: false } },
            { ledgerShareToken: '' },
          ],
        },
        { $set: { ledgerShareToken: token } },
        { new: true },
      );
      if (updated?.ledgerShareToken) {
        customer.ledgerShareToken = updated.ledgerShareToken;
        return updated.ledgerShareToken;
      }
      // Another request may have set it — reload
      const fresh = await Customer.findById(customer._id).select('ledgerShareToken');
      if (fresh?.ledgerShareToken) {
        customer.ledgerShareToken = fresh.ledgerShareToken;
        return fresh.ledgerShareToken;
      }
      token = createLedgerShareToken();
    } catch (err) {
      if (err?.code !== 11000) throw err;
      token = createLedgerShareToken();
    }
  }
  throw new Error('Unable to create ledger share token');
}

function toMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

/** Public (unauthenticated) ledger payload for shared links */
export async function getPublicLedger(req, res) {
  try {
    const token = String(req.params.token || '').trim();
    if (!token || token.length < 16) {
      return res.status(400).json({ message: 'Invalid share link' });
    }

    const customer = await Customer.findOne({ ledgerShareToken: token });
    if (!customer) {
      return res.status(404).json({ message: 'Ledger link not found or expired' });
    }

    const owner = await User.findById(customer.ownerId).select('shopName ownerName email phone settings');
    if (!owner) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const txns = await Transaction.find({
      customerId: customer._id,
      ownerId: customer.ownerId,
    }).sort({ date: 1 });

    const settings = owner.settings || {};
    const shop = {
      shopName: settings.shopName || owner.shopName || 'Shop',
      ownerName: settings.ownerName || owner.ownerName || '',
      shopPhone: settings.shopPhone || owner.phone || '',
      shopEmail: settings.shopEmail || owner.email || '',
      shopAddress: settings.shopAddress || '',
    };

    return res.json({
      shop,
      customer: {
        id: String(customer._id),
        name: customer.name,
        phone: customer.phone || '',
        area: customer.area || '',
        balance: toMoney(customer.balance || 0),
        transactions: txns.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          note: tx.note || '',
          date: new Date(tx.date).toISOString(),
          balance: tx.balance,
        })),
      },
    });
  } catch {
    return res.status(500).json({ message: 'Failed to load ledger' });
  }
}
