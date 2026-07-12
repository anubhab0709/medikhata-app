import mongoose from 'mongoose';



const customerSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, default: '', trim: true, maxlength: 50 },
    area: { type: String, default: '', trim: true, maxlength: 200 },
    balance: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    lastReminded: { type: Date, default: null },
    firstReminderAt: { type: Date, default: null },
    reminderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

customerSchema.index({ ownerId: 1, updatedAt: -1 });
customerSchema.index({ ownerId: 1, phone: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
