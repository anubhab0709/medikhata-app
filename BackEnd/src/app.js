import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

const app = express();

// Required behind Render/Nginx/Cloudflare so rate limits use the real client IP
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  return allowedOrigins.includes(normalized);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email
      ? String(req.body.email).trim().toLowerCase()
      : ipKeyGenerator(req.ip);
  },
  message: { message: 'Too many login attempts for this account. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email
      ? `otp:${String(req.body.email).trim().toLowerCase()}`
      : ipKeyGenerator(req.ip);
  },
  message: { message: 'Too many OTP requests. Please try again later.' },
});

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password change attempts. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  // Required for Vercel/localhost frontend talking to Render API
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'medikhata-api',
    health: '/api/health',
    docs: 'API base path is /api',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'medikhata-api' });
});

app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    service: 'medikhata-api',
    message: 'MediKhata API root. Use a specific endpoint.',
    endpoints: {
      health: 'GET /api/health',
      auth: '/api/auth/*',
      customers: '/api/customers/*',
      support: '/api/support/*',
    },
  });
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/change-password', passwordChangeLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/customers', generalLimiter, customerRoutes);
app.use('/api/support', generalLimiter, supportRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const statusCode = err?.status || 500;
  const isServerError = statusCode >= 500;
  res.status(statusCode).json({
    message: isServerError ? 'Internal server error' : (err?.message || 'Request failed'),
  });
});

export default app;
