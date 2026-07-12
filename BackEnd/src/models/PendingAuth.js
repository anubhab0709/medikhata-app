import mongoose from 'mongoose';

const pendingAuthSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ['signup', 'reset'], required: true },
    ownerName: { type: String, default: '', trim: true, maxlength: 200 },
    passwordHash: { type: String, default: null },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, required: true },
    resendCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pendingAuthSchema.index({ email: 1, purpose: 1 }, { unique: true });
// Auto-delete expired challenges (Mongo TTL monitor runs ~every 60s)
pendingAuthSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingAuth = mongoose.model('PendingAuth', pendingAuthSchema);
