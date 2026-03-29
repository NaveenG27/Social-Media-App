import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AuthService } from '@/services/auth.service';
import { PostService } from '@/services/post.service';
import { handleApiError, AppError } from '@/lib/errors';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const user = await AuthService.getCurrentUser();
    
    
    const resolvedParams = await params;
    const postId = resolvedParams.post_id;

    if (!postId) {
       throw new AppError('Post ID is missing in the request.', 400);
    }

    await PostService.softDeletePost(user.id, postId);

    return NextResponse.json({ success: true, message: 'Post successfully deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.post_id;

    if (!postId) {
      throw new AppError('Post ID is missing in request params.', 400);
    }

    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id, 
        content, 
        image_url, 
        created_at, 
        updated_at, 
        like_count, 
        comment_count, 
        profiles(username, avatar_url)
      `)
      .eq('id', postId)
      .eq('is_active', true)
      .single();

    if (error || !post) {
      throw new AppError('Post not found', 404);
    }

    return NextResponse.json({ success: true, data: post }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
