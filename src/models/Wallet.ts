import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IWalletTransaction {
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: mongoose.Types.ObjectId;
  razorpayPaymentId?: string;
  createdAt: Date;
}

export interface IWallet extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  balance: number;
  transactions: IWalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  razorpayPaymentId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [walletTransactionSchema],
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ user: 1 });

const Wallet = models.Wallet || model<IWallet>('Wallet', walletSchema);

export default Wallet;
