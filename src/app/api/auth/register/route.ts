import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { LoginSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request payload
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0], // Give simple full name as default
        }
      }
    });

    if (signupError) {
      throw new AppError(signupError.message, 400);
    }

    // Default username profile setup occurs automatically or manually requested later
    return NextResponse.json({ 
      success: true, 
      user: authData.user 
    });

  } catch (error) {
    return handleApiError(error);
  }
}
