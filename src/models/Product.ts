import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IProductVariant {
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku?: string;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  price: number;
  discountPrice?: number;
  unit: string; // kg, piece, pack, etc.
  stock: number;
  minOrderQty: number;
  maxOrderQty: number;
  variants?: IProductVariant[];
  tags?: string[];
  isVeg: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  isActive: boolean;
  averageRating: number;
  totalRatings: number;
  totalSold: number;
  preparationTime?: number; // in minutes (for food items)
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String },
});

const productSchema = new Schema<IProduct>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: [{
      type: String,
      required: true,
    }],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'piece',
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrderQty: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxOrderQty: {
      type: Number,
      default: 10,
      min: 1,
    },
    variants: [productVariantSchema],
    tags: [{ type: String }],
    isVeg: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    preparationTime: {
      type: Number,
      min: 0,
    },
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ slug: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ isActive: 1, isAvailable: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });

const Product = models.Product || model<IProduct>('Product', productSchema);

export default Product;
