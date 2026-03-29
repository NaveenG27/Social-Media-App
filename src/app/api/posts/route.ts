import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PostSchema } from '@/lib/validations';
import { validateImage } from '@/lib/validators/image';
import { handleApiError, AppError } from '@/lib/errors';
import { AuthService } from '@/services/auth.service';
import { PostService } from '@/services/post.service';

export async function POST(request: Request) {
  try {
    const user = await AuthService.getCurrentUser();
    const formData = await request.formData();
    
    const content = formData.get('content') as string;
    const file = formData.get('image') as File | null;

    // Validate textual content
    const parsed = PostSchema.safeParse({ content: content || '' });
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    let imageUrl = null;
    const supabase = await createClient();

    // Validate and upload image if present
    if (file && file.size > 0) {
      validateImage(file);  

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw new AppError('Failed to upload image.', 500);

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);
        
      imageUrl = publicUrl;
    }

    // Delegate to post service
    await PostService.createPost(user.id, content, imageUrl);

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const posts = await PostService.getGlobalFeed(page, limit);

    return NextResponse.json({
      success: true,
      data: posts,
      page,
      limit,
      hasMore: posts && posts.length === limit
    });
  } catch (error) {
    return handleApiError(error);
  }
}
