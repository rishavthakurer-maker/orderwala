import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/delivery/onboarding - Check onboarding status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userSnap = await db.collection(Collections.USERS).doc(session.user.id).get();

    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = userSnap.data()!;
    const metadata = (user.metadata as Record<string, unknown>) || {};
    const onboarding = (metadata.onboarding as Record<string, unknown>) || {};

    // Check completion of each step
    const vehicle = metadata.vehicle as Record<string, string> | null;
    const bankDetails = metadata.bankDetails as Record<string, string> | null;
    const documents = metadata.documents as unknown[] | null;
    const workingArea = metadata.workingArea as Record<string, unknown> | null;

    const steps = {
      vehicle: !!(vehicle && vehicle.type && vehicle.numberPlate),
      documents: !!(documents && documents.length > 0),
      bankDetails: !!(bankDetails && bankDetails.accountNumber && bankDetails.ifsc),
      workingArea: !!(workingArea && workingArea.lat && workingArea.lng),
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const isComplete = completedSteps === totalSteps;

    return NextResponse.json({
      success: true,
      data: {
        steps,
        completedSteps,
        totalSteps,
        isComplete,
        isVerified: user.is_verified,
        onboardingSubmitted: !!onboarding.submittedAt,
      },
    });
  } catch (error) {
    console.error('Onboarding check error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/delivery/onboarding - Save onboarding data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = session.user.id;
    const body = await request.json();
    const { step, data } = body;

    // Get current metadata
    const userSnap = await db.collection(Collections.USERS).doc(userId).get();
    const currentMetadata = (userSnap.exists ? (userSnap.data()!.metadata as Record<string, unknown>) : null) || {};

    switch (step) {
      case 'vehicle': {
        const { type, brand, model, numberPlate, color } = data;
        if (!type || !numberPlate) {
          return NextResponse.json({ success: false, error: 'Vehicle type and registration number are required' }, { status: 400 });
        }
        currentMetadata.vehicle = { type, brand, model, numberPlate, color };
        break;
      }

      case 'documents': {
        const { documentType, documentNumber } = data;
        if (!documentType || !documentNumber) {
          return NextResponse.json({ success: false, error: 'Document type and number are required' }, { status: 400 });
        }
        const existing = (currentMetadata.documents as Record<string, string>[]) || [];
        const idx = existing.findIndex(d => d.type === documentType);
        const docEntry = { type: documentType, number: documentNumber, status: 'pending', uploadedAt: new Date().toISOString() };
        if (idx >= 0) existing[idx] = docEntry;
        else existing.push(docEntry);
        currentMetadata.documents = existing;
        break;
      }

      case 'bankDetails': {
        const { accountName, accountNumber, ifsc, bankName, upiId } = data;
        if (!accountNumber || !ifsc) {
          return NextResponse.json({ success: false, error: 'Account number and IFSC are required' }, { status: 400 });
        }
        currentMetadata.bankDetails = { accountName, accountNumber, ifsc, bankName, upiId };
        break;
      }

      case 'workingArea': {
        const { lat, lng, address, radius } = data;
        if (!lat || !lng) {
          return NextResponse.json({ success: false, error: 'Location is required' }, { status: 400 });
        }
        currentMetadata.workingArea = { lat, lng, address, radius: radius || 5 };
        break;
      }

      case 'submit': {
        currentMetadata.onboarding = {
          ...((currentMetadata.onboarding as Record<string, unknown>) || {}),
          submittedAt: new Date().toISOString(),
          status: 'pending_review',
        };
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid step' }, { status: 400 });
    }

    // Update metadata
    await db.collection(Collections.USERS).doc(userId).update({
      metadata: currentMetadata,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: `${step} saved successfully` });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
