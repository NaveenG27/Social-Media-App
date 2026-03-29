import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AuthService } from '@/services/auth.service';
import { handleApiError, AppError } from '@/lib/errors';

export async function GET() {
  try {
    const user = await AuthService.getCurrentUser();
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile) {
      throw new AppError('Profile not found', 404);
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await AuthService.getCurrentUser();
    const formData = await request.formData();
    
    // Extract avatar file from the request
    const file = formData.get('avatar') as File | null;

    if (!file || file.size === 0) {
      throw new AppError("No avatar file provided.", 400);
    }

    const { validateImage } = await import('@/lib/validators/image');
    
    
    validateImage(file);

    const supabase = await createClient();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    // Upload to 'avatar' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatar')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      throw new AppError("Failed to upload avatar image to storage bucket.", 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatar')
      .getPublicUrl(fileName);

    // Update user profile record with new avatar
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      throw new AppError("Failed to link avatar to profile.", 500);
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}
