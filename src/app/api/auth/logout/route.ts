import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/errors';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
