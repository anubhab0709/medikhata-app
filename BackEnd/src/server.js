import './config/loadEnv.js';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { isEmailConfigured } from './services/email/index.js';

const port = Number(process.env.PORT || 5000);

function validateEnv() {
  const jwtSecret = process.env.JWT_SECRET;
  const minSecretLen = process.env.NODE_ENV === 'production' ? 32 : 16;
  if (!jwtSecret || jwtSecret.length < minSecretLen) {
    throw new Error(`JWT_SECRET is missing or too short (min ${minSecretLen} characters)`);
  }

  if (process.env.NODE_ENV === 'production') {
    const cors = process.env.CORS_ORIGIN || '';
    if (!cors || cors.includes('localhost') || cors.includes('loca.lt')) {
      console.warn('[warn] CORS_ORIGIN should list only your production frontend origin(s)');
    }
    if (!isEmailConfigured()) {
      throw new Error('RESEND_API_KEY is required in production');
    }
  }

  if (!isEmailConfigured()) {
    console.warn(
      '[warn] RESEND_API_KEY is not set. OTP emails will not be delivered. Add it to BackEnd/.env'
    );
  } else {
    console.log('[email] Resend configured');
  }
}

async function startServer() {
  try {
    validateEnv();
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
