import { createClient } from '@/utils/supabase/server';
import { AppError } from '@/lib/errors';

export class PostService {
  /**
   * Retrieves a personalized paginated feed
   */
  static async getPersonalizedFeed(userId: string, page: number = 0, limit: number = 15) {
    const supabase = await createClient();
    
    // 1. Get the list of users the current user is following
    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followsError) {
      throw new AppError('Error fetching social graph.', 500);
    }

    const followingIds = followsData?.map(f => f.following_id) || [];
    
    // Usually, you might also want to see your own posts on your feed
    followingIds.push(userId);

    // 2. Fetch paginated posts strictly from followingIds
    const startOffset = page * limit;
    const endOffset = startOffset + limit - 1;

    const { data: globalPosts, error: feedError } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url), likes:likes(user_id), comments:comments!comments_post_id_fkey(id)')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(startOffset, endOffset);

    if (feedError) {
      throw new AppError('Error fetching feed.', 500);
    }

    return globalPosts;
  }

  /**
   * Create a new post
   */
  static async createPost(userId: string, content: string, imageUrl?: string | null) {
    const supabase = await createClient();
    
    // We assume input has been validated heavily by the route handler
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content,
        image_url: imageUrl || null
      });

    if (error) {
      throw new AppError(error.message, 400);
    }
    
    return { success: true };
  }

  /**
   * Retrieves a non-personalized, global paginated feed
   */
  static async getGlobalFeed(page: number = 0, limit: number = 15) {
    const supabase = await createClient();
    
    const startOffset = page * limit;
    const endOffset = startOffset + limit - 1;

    // Must strictly include is_active = true and required counts according to instructions
    const { data: globalPosts, error: feedError } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(startOffset, endOffset);

    if (feedError) {
      throw new AppError('Error fetching global feed.', 500);
    }

    return globalPosts;
  }

  /**
   * Securely soft-deletes a post matching the current user id
   */
  static async softDeletePost(userId: string, postId: string) {
    const supabase = await createClient();
    
    // Using string matching for UUID
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
      
    if (fetchError || !existingPost) {
      throw new AppError('Post not found.', 404);
    }
    
    if (existingPost.user_id !== userId) {
      throw new AppError('Unauthorized to delete this post.', 403);
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', postId);

    if (deleteError) {
      throw new AppError('Failed to soft delete post.', 500);
    }

    return { success: true };
  }
}
