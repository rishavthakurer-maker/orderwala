import { NextRequest, NextResponse } from 'next/server';
import { getStorageBucket } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// POST /api/seller/upload - Upload image for vendor (products / store logo)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max size: 5MB' },
        { status: 400 }
      );
    }

    const bucket = getStorageBucket();

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `uploads/${folder}/${session.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const bucketFile = bucket.file(filePath);
    await bucketFile.save(buffer, {
      contentType: file.type,
      metadata: {
        uploadedBy: session.user.id,
        originalName: file.name,
      },
    });

    // Make file publicly accessible
    await bucketFile.makePublic();

    // Build public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({
      success: true,
      data: { url: publicUrl, path: filePath },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
