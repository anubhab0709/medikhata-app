import { SupportMessage } from '../models/SupportMessage.js';
import { User } from '../models/User.js';
import { emailService } from '../services/email/index.js';

export async function createSupportMessage(req, res) {
  try {
    const { name, email = '', message } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const cleanName = String(name).trim().slice(0, 200);
    const cleanEmail = String(email).trim().slice(0, 200);
    const cleanMessage = String(message).trim().slice(0, 4000);

    let shopName = '';
    try {
      const user = await User.findById(req.user.id).select('shopName settings.shopName');
      shopName = user?.shopName || user?.settings?.shopName || '';
    } catch {
      // non-fatal
    }

    await SupportMessage.create({
      userId: req.user.id,
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
    });

    try {
      await emailService.sendSupportMessage({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        shopName,
      });
    } catch (mailErr) {
      console.error('support email failed:', mailErr?.message || mailErr);
      return res.status(502).json({
        message: 'Message saved, but email delivery failed. Please try again or email us directly.',
      });
    }

    return res.status(201).json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Failed to send support message' });
  }
}
