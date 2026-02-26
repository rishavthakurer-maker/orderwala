import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface VehicleInfo {
  type: string;
  number: string;
  model?: string;
}

interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName?: string;
}

// =============================================================================
// Payment Gateway & Options Types
// =============================================================================

/** Supported payment gateways for payout processing */
type PaymentGateway = 'razorpay' | 'stripe' | 'paytm' | 'phonepe' | 'cashfree' | 'paypal';

/** Supported payout methods for delivery partners */
type PayoutMethod = 'bank_transfer' | 'upi' | 'wallet' | 'paytm_wallet' | 'phonepe_wallet';

interface UPIDetails {
  upiId: string;
  upiProvider?: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'other';
  isVerified: boolean;
}

interface WalletDetails {
  walletType: 'paytm' | 'phonepe' | 'amazon_pay' | 'mobikwik' | 'freecharge';
  walletId: string;
  linkedPhone: string;
  isVerified: boolean;
}

interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  isEnabled: boolean;
  merchantId?: string;
  accountId?: string;
  isVerified: boolean;
  lastVerifiedAt?: string;
}

interface PayoutPreferences {
  preferredMethod: PayoutMethod;
  preferredGateway: PaymentGateway;
  minimumPayoutAmount: number;
  autoPayout: boolean;
  payoutSchedule: 'daily' | 'weekly' | 'monthly' | 'on_demand';
}

interface PaymentOptions {
  upi?: UPIDetails;
  wallets: WalletDetails[];
  gateways: PaymentGatewayConfig[];
  payoutPreferences: PayoutPreferences;
}

interface DeliveryPartnerMetadata {
  vehicle?: VehicleInfo;
  bankDetails?: BankDetails;
  documents?: string[];
  paymentOptions?: PaymentOptions;
}

interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  vehicle?: VehicleInfo;
  bankDetails?: BankDetails;
  paymentOptions?: Partial<PaymentOptions>;
}

interface DeliveryPartnerProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  address: string | null;
  isActive: boolean;
  isVerified: boolean;
  joinedDate: string;
  rating: number;
  totalRatings: number;
  totalDeliveries: number;
  vehicle: VehicleInfo | null;
  bankDetails: BankDetails | null;
  documents: string[];
  paymentOptions: PaymentOptions | null;
}

// =============================================================================
// Constants
// =============================================================================

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access. Delivery partner authentication required.',
  PROFILE_NOT_FOUND: 'Delivery partner profile not found.',
  UPDATE_FAILED: 'Failed to update profile. Please try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  INVALID_PAYLOAD: 'Invalid request payload.',
  INVALID_UPI: 'Invalid UPI ID format.',
  INVALID_WALLET: 'Invalid wallet configuration.',
  GATEWAY_NOT_SUPPORTED: 'Payment gateway is not supported.',
  PAYOUT_CONFIG_INVALID: 'Invalid payout configuration.',
} as const;

/** Supported payment gateways */
const SUPPORTED_GATEWAYS: PaymentGateway[] = [
  'razorpay',
  'stripe', 
  'paytm',
  'phonepe',
  'cashfree',
  'paypal',
];

/** Supported payout methods */
const SUPPORTED_PAYOUT_METHODS: PayoutMethod[] = [
  'bank_transfer',
  'upi',
  'wallet',
  'paytm_wallet',
  'phonepe_wallet',
];

/** Default payout preferences for new delivery partners */
const DEFAULT_PAYOUT_PREFERENCES: PayoutPreferences = {
  preferredMethod: 'bank_transfer',
  preferredGateway: 'razorpay',
  minimumPayoutAmount: 100,
  autoPayout: true,
  payoutSchedule: 'weekly',
};

/** Default payment options structure */
const DEFAULT_PAYMENT_OPTIONS: PaymentOptions = {
  wallets: [],
  gateways: SUPPORTED_GATEWAYS.map((gateway) => ({
    gateway,
    isEnabled: gateway === 'razorpay',
    isVerified: false,
  })),
  payoutPreferences: DEFAULT_PAYOUT_PREFERENCES,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates the delivery partner session
 */
async function validateDeliveryPartnerSession() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'delivery') {
    return { isValid: false, userId: null };
  }
  
  return { isValid: true, userId: session.user.id };
}

/**
 * Calculates the average rating from a list of rated orders
 */
function calculateAverageRating(ratedOrders: { delivery_rating: number | null }[] | null): number {
  if (!ratedOrders || ratedOrders.length === 0) {
    return 0;
  }
  
  const totalRating = ratedOrders.reduce(
    (sum, order) => sum + (order.delivery_rating || 0),
    0
  );
  
  return parseFloat((totalRating / ratedOrders.length).toFixed(1));
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Creates a standardized success response
 */
function createSuccessResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });
}

/**
 * Validates UPI ID format (example: username@bankname)
 */
function isValidUpiId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
}

/**
 * Validates and sanitizes payment options before saving
 */
function validatePaymentOptions(
  paymentOptions: Partial<PaymentOptions>,
  existingOptions: PaymentOptions
): { isValid: boolean; error?: string; sanitized?: PaymentOptions } {
  const sanitized: PaymentOptions = { ...existingOptions };

  // Validate UPI details if provided
  if (paymentOptions.upi) {
    if (!isValidUpiId(paymentOptions.upi.upiId)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_UPI };
    }
    sanitized.upi = {
      upiId: paymentOptions.upi.upiId.toLowerCase().trim(),
      upiProvider: paymentOptions.upi.upiProvider || 'other',
      isVerified: false, // Reset verification on update
    };
  }

  // Validate and merge wallets
  if (paymentOptions.wallets && Array.isArray(paymentOptions.wallets)) {
    const validWalletTypes = ['paytm', 'phonepe', 'amazon_pay', 'mobikwik', 'freecharge'];
    const validWallets = paymentOptions.wallets.filter(
      (wallet) =>
        wallet.walletType &&
        validWalletTypes.includes(wallet.walletType) &&
        wallet.walletId &&
        wallet.linkedPhone
    );
    sanitized.wallets = validWallets.map((wallet) => ({
      ...wallet,
      isVerified: false,
    }));
  }

  // Validate gateway configurations
  if (paymentOptions.gateways && Array.isArray(paymentOptions.gateways)) {
    sanitized.gateways = paymentOptions.gateways
      .filter((g) => SUPPORTED_GATEWAYS.includes(g.gateway))
      .map((g) => ({
        gateway: g.gateway,
        isEnabled: g.isEnabled ?? false,
        merchantId: g.merchantId,
        accountId: g.accountId,
        isVerified: false,
      }));

    // Ensure all supported gateways are present
    for (const gateway of SUPPORTED_GATEWAYS) {
      if (!sanitized.gateways.find((g) => g.gateway === gateway)) {
        sanitized.gateways.push({
          gateway,
          isEnabled: false,
          isVerified: false,
        });
      }
    }
  }

  // Validate payout preferences
  if (paymentOptions.payoutPreferences) {
    const prefs = paymentOptions.payoutPreferences;

    if (prefs.preferredMethod && !SUPPORTED_PAYOUT_METHODS.includes(prefs.preferredMethod)) {
      return { isValid: false, error: ERROR_MESSAGES.PAYOUT_CONFIG_INVALID };
    }

    if (prefs.preferredGateway && !SUPPORTED_GATEWAYS.includes(prefs.preferredGateway)) {
      return { isValid: false, error: ERROR_MESSAGES.GATEWAY_NOT_SUPPORTED };
    }

    sanitized.payoutPreferences = {
      preferredMethod: prefs.preferredMethod ?? existingOptions.payoutPreferences.preferredMethod,
      preferredGateway: prefs.preferredGateway ?? existingOptions.payoutPreferences.preferredGateway,
      minimumPayoutAmount: Math.max(prefs.minimumPayoutAmount ?? 100, 100),
      autoPayout: prefs.autoPayout ?? existingOptions.payoutPreferences.autoPayout,
      payoutSchedule: prefs.payoutSchedule ?? existingOptions.payoutPreferences.payoutSchedule,
    };
  }

  return { isValid: true, sanitized };
}

// =============================================================================
// API Handlers
// =============================================================================

/**
 * GET /api/delivery/profile
 * 
 * Retrieves the authenticated delivery partner's profile information,
 * including personal details, verification status, and delivery statistics.
 * 
 * @returns {DeliveryPartnerProfile} The delivery partner's complete profile
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { isValid, userId } = await validateDeliveryPartnerSession();
    
    if (!isValid || !userId) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const db = getDb();

    // Fetch user profile
    const userSnap = await db.collection(Collections.USERS).doc(userId).get();

    if (!userSnap.exists) {
      return createErrorResponse(ERROR_MESSAGES.PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const user = userSnap.data()!;

    // Fetch delivery statistics: all orders for this delivery partner
    const ordersSnap = await db.collection(Collections.ORDERS)
      .where('delivery_partner_id', '==', userId)
      .get();

    const allOrders = ordersSnap.docs.map(doc => doc.data());
    const ratedOrders = allOrders
      .filter(o => o.delivery_rating != null)
      .map(o => ({ delivery_rating: o.delivery_rating as number }));
    const totalDeliveries = allOrders.filter(o => o.status === 'delivered').length;
    const averageRating = calculateAverageRating(ratedOrders);
    const metadata = (user.metadata as DeliveryPartnerMetadata) || {};

    // Ensure payment options have defaults if not set
    const paymentOptions: PaymentOptions = metadata.paymentOptions
      ? {
          ...DEFAULT_PAYMENT_OPTIONS,
          ...metadata.paymentOptions,
          gateways: metadata.paymentOptions.gateways?.length
            ? metadata.paymentOptions.gateways
            : DEFAULT_PAYMENT_OPTIONS.gateways,
          payoutPreferences: {
            ...DEFAULT_PAYOUT_PREFERENCES,
            ...metadata.paymentOptions.payoutPreferences,
          },
        }
      : DEFAULT_PAYMENT_OPTIONS;

    const profile: DeliveryPartnerProfile = {
      _id: userSnap.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      address: user.address,
      isActive: user.is_active,
      isVerified: user.is_verified,
      joinedDate: user.created_at,
      rating: averageRating,
      totalRatings: ratedOrders.length,
      totalDeliveries,
      vehicle: metadata.vehicle ?? null,
      bankDetails: metadata.bankDetails ?? null,
      documents: metadata.documents ?? [],
      paymentOptions,
    };

    return createSuccessResponse(profile);
  } catch (error) {
    console.error('[DeliveryProfile:GET] Error fetching profile:', error);
    return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/delivery/profile
 * 
 * Updates the authenticated delivery partner's profile information.
 * Supports updating personal details, vehicle information, and bank details.
 * 
 * @param {NextRequest} request - The incoming request with update payload
 * @returns {Object} Success confirmation message
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { isValid, userId } = await validateDeliveryPartnerSession();
    
    if (!isValid || !userId) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    let payload: ProfileUpdatePayload;
    
    try {
      payload = await request.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_PAYLOAD, HTTP_STATUS.BAD_REQUEST);
    }

    const { name, phone, email, address, vehicle, bankDetails, paymentOptions } = payload;
    const db = getDb();

    // Build the update object for basic fields
    const userUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (name?.trim()) userUpdate.name = name.trim();
    if (phone?.trim()) userUpdate.phone = phone.trim();
    if (email?.trim()) userUpdate.email = email.trim().toLowerCase();
    if (address?.trim()) userUpdate.address = address.trim();

    // Fetch current metadata to merge with updates
    const userSnap = await db.collection(Collections.USERS).doc(userId).get();

    if (!userSnap.exists) {
      console.error('[DeliveryProfile:PUT] User not found:', userId);
      return createErrorResponse(ERROR_MESSAGES.UPDATE_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const currentMetadata = (userSnap.data()!.metadata as DeliveryPartnerMetadata) || {};

    // Update metadata fields if provided
    if (vehicle !== undefined) {
      currentMetadata.vehicle = vehicle;
    }
    
    if (bankDetails !== undefined) {
      currentMetadata.bankDetails = bankDetails;
    }

    // Validate and update payment options if provided
    if (paymentOptions !== undefined) {
      const existingPaymentOptions = currentMetadata.paymentOptions ?? DEFAULT_PAYMENT_OPTIONS;
      const validationResult = validatePaymentOptions(paymentOptions, existingPaymentOptions);

      if (!validationResult.isValid) {
        return createErrorResponse(
          validationResult.error ?? ERROR_MESSAGES.PAYOUT_CONFIG_INVALID,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      currentMetadata.paymentOptions = validationResult.sanitized;
    }

    userUpdate.metadata = currentMetadata;

    // Perform the update
    await db.collection(Collections.USERS).doc(userId).update(userUpdate);

    return createSuccessResponse(null, 'Profile updated successfully');
  } catch (error) {
    console.error('[DeliveryProfile:PUT] Unexpected error:', error);
    return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
