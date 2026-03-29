import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, AppError } from '@/lib/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.user_id;

    if (!userId) {
      throw new AppError('User ID is missing.', 400);
    }

    const supabase = await createClient();

    // Fetch user profile stats 
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url, website, location, followers_count, posts(count)')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new AppError('User not found', 404);
    }

    
    const postsCount = profile.posts?.[0]?.count || 0;

    const formattedData = {
      id: profile.id,
      username: profile.username,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      website: profile.website,
      location: profile.location,
      followers_count: profile.followers_count,
      posts_count: postsCount,
    };

    return NextResponse.json({ success: true, data: formattedData }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
