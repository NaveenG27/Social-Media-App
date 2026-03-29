import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { handleApiError } from '@/lib/errors';
import { AuthService } from '@/services/auth.service';

export async function GET(request: Request) {
  try {
    // Optionally securing the route by verifying an authenticated session 
    // depending on the platform's public/private intent. 
    await AuthService.getCurrentUser();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const users = await UserService.getUsers(page, limit);

    return NextResponse.json({
      success: true,
      data: users,
      page,
      limit,
      hasMore: users && users.length === limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
