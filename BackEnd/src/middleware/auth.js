import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { cookieOptions } from '../utils/authHelpers.js';

function clearAuthCookie(res) {
  const { maxAge: _maxAge, ...opts } = cookieOptions();
  res.clearCookie('token', opts);
}

export async function requireAuth(req, res, next) {
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers.authorization || '';
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  if (!jwtSecret) return res.status(500).json({ message: 'Authentication is not configured' });

  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    const userExists = await User.exists({ _id: payload.userId });
    if (!userExists) {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = { id: payload.userId };
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ message: 'Invalid token' });
  }
}
