import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, default: '', trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

export const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
