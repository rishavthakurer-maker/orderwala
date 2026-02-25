import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicates and fast queries
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

const Favorite = models.Favorite || model<IFavorite>('Favorite', favoriteSchema);

export default Favorite;
