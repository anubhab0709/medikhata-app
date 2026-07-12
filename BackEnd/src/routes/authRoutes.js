import { Router } from 'express';
import {
  signup,
  login,
  me,
  updateSettings,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  sendOtp,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/register', signup); // alias
router.post('/login', login);
router.post('/logout', logout);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', requireAuth, me);
router.patch('/settings', requireAuth, updateSettings);
router.post('/change-password', requireAuth, changePassword);

export default router;
