import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = getDb();
    const snapshot = await db.collection(Collections.USERS)
      .where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = snapshot.docs[0].data();
    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error('Check role error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
