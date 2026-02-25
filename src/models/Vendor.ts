import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  storeName: string;
  slug: string;
  description?: string;
  logo: string;
  coverImage?: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  category: 'restaurant' | 'grocery' | 'meat' | 'vegetables' | 'general';
  cuisines?: string[];
  deliveryRadius: number; // in km
  minOrderAmount: number;
  deliveryFee: number;
  commissionRate: number; // percentage
  averageRating: number;
  totalRatings: number;
  totalOrders: number;
  isOpen: boolean;
  isVerified: boolean;
  isActive: boolean;
  openingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  documents?: {
    panCard?: string;
    gstNumber?: string;
    fssaiLicense?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      type: String,
      required: [true, 'Store logo is required'],
    },
    coverImage: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      lowercase: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    category: {
      type: String,
      enum: ['restaurant', 'grocery', 'meat', 'vegetables', 'general'],
      required: true,
    },
    cuisines: [{ type: String }],
    deliveryRadius: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 50,
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
    totalOrders: {
      type: Number,
      default: 0,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openingHours: [
      {
        day: String,
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
    ],
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
    documents: {
      panCard: String,
      gstNumber: String,
      fssaiLicense: String,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ slug: 1 });
vendorSchema.index({ owner: 1 });
vendorSchema.index({ category: 1 });
vendorSchema.index({ isActive: 1, isVerified: 1, isOpen: 1 });
vendorSchema.index({ 'address.coordinates': '2dsphere' });

const Vendor = models.Vendor || model<IVendor>('Vendor', vendorSchema);

export default Vendor;
