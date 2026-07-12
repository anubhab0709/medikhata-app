import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: '', trim: true, maxlength: 200 },
    ownerName: { type: String, default: '', trim: true, maxlength: 200 },
    shopPhone: { type: String, default: '', trim: true, maxlength: 50 },
    shopEmail: { type: String, default: '', trim: true, maxlength: 200 },
    shopAddress: { type: String, default: '', trim: true, maxlength: 500 },
    brandName: { type: String, default: '', trim: true, maxlength: 200 },
    quickSignature: { type: String, default: '', trim: true, maxlength: 200 },
    whatsappCountryCode: { type: String, default: '91', trim: true, maxlength: 10 },
    defaultTemplateLang: { type: String, enum: ['en', 'bn'], default: 'en' },
    firstReminderAfterDays: { type: Number, default: 3, min: 1 },
    secondReminderAfterDays: { type: Number, default: 7, min: 1 },
    markOverdueAfterDays: { type: Number, default: 7, min: 1 },
    messageLanguage: { type: String, enum: ['en', 'bn'], default: 'en' },
    appLanguage: { type: String, enum: ['en', 'bn'], default: 'en' },
    messageEn: { type: String, default: '', maxlength: 2000 },
    messageBn: { type: String, default: '', maxlength: 2000 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true, maxlength: 200 },
    ownerName: { type: String, required: true, trim: true, maxlength: 200 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    phone: { type: String, default: '', trim: true, maxlength: 50 },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, default: null },
    otpPurpose: { type: String, enum: ['signup', 'reset', null], default: null },
    otpResendCount: { type: Number, default: 0 },
    // Temporary signup payload stored as hashed password until OTP verifies
    pendingPasswordHash: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    settings: { type: userSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
