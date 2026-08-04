import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { randomBytes } from 'crypto';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function GET() {
  const authz = await requireAuth();
  if (authz instanceof NextResponse) return authz;

  const user = await prisma.user.findUnique({
    where: { id: authz.userId },
    select: { avatarUrl: true },
  });

  return NextResponse.json({ url: user?.avatarUrl ?? null });
}

export async function POST(req: NextRequest) {
  const authz = await requireAuth();
  if (authz instanceof NextResponse) return authz;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const file = formData.get('avatar');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: authz.userId },
    select: { avatarUrl: true },
  });

  let processed: Buffer;
  try {
    const sharp = (await import('sharp')).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    processed = await sharp(buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: 'Could not process image — ensure it is a valid JPEG, PNG, or WebP' },
      { status: 400 },
    );
  }

  // Key is server-generated from userId + random suffix; never from client-supplied filename.
  // Random suffix ensures each upload gets a fresh CDN URL so stale caches don't serve old images.
  const suffix = randomBytes(4).toString('hex');
  const key = `avatars/user-${authz.userId}-${suffix}.webp`;

  let blobUrl: string;
  try {
    const blob = await put(key, processed, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });
    blobUrl = blob.url;
  } catch (err) {
    console.error('[avatar POST] blob put failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  // Delete old blob after successful upload. A failure here is non-fatal — log and continue.
  if (existing?.avatarUrl) {
    try {
      await del(existing.avatarUrl);
    } catch (err) {
      console.error('[avatar POST] old blob delete failed:', err);
    }
  }

  await prisma.user.update({
    where: { id: authz.userId },
    data: { avatarUrl: blobUrl },
  });

  return NextResponse.json({ url: blobUrl });
}

export async function DELETE() {
  const authz = await requireAuth();
  if (authz instanceof NextResponse) return authz;

  const user = await prisma.user.findUnique({
    where: { id: authz.userId },
    select: { avatarUrl: true },
  });

  if (user?.avatarUrl) {
    try {
      await del(user.avatarUrl);
    } catch (err) {
      console.error('[avatar DELETE] blob delete failed:', err);
    }
  }

  await prisma.user.update({
    where: { id: authz.userId },
    data: { avatarUrl: null },
  });

  return NextResponse.json({ ok: true });
}
