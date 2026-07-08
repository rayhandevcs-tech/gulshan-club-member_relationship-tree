import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin, PHOTOS_BUCKET } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${randomUUID()}.jpg`;

  const { error } = await supabaseAdmin.storage
    .from(PHOTOS_BUCKET)
    .upload(key, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(PHOTOS_BUCKET).getPublicUrl(key);
  return NextResponse.json({ url: data.publicUrl, key });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.storage.from(PHOTOS_BUCKET).remove([key]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
