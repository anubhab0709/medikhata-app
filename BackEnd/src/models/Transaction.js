import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    id: { type: String, required: true, maxlength: 100 },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, default: '', maxlength: 500 },
    date: { type: Date, required: true },
    balance: { type: Number, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ customerId: 1, date: 1 });
transactionSchema.index({ customerId: 1, id: 1 }, { unique: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
