import { NextResponse } from 'next/server';
import { PostService } from '@/services/post.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const user = await AuthService.getCurrentUser();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const posts = await PostService.getPersonalizedFeed(user.id, page, limit);

    return NextResponse.json({
      success: true,
      data: posts,
      page,
      limit,
      hasMore: posts && posts.length === limit
    });
  } catch (error) {
    console.error('[API/Feed] Internal error:', error);
    return handleApiError(error);
  }
}
