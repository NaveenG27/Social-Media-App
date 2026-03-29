import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { LoginSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/errors';
import { AuthService } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Server-side input validation
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    // Authenticate with Supabase
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      throw new AppError(loginError.message, 401);
    }

    // After successful login, track the last login timestamp directly asynchronously
    await AuthService.updateLastLogin(authData.user.id);

    return NextResponse.json({ success: true, user: authData.user });

  } catch (error) {
    return handleApiError(error);
  }
}
