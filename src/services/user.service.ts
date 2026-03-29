import { createClient } from '@/utils/supabase/server';
import { AppError } from '@/lib/errors';

export class UserService {
  /**
   * Retrieves a paginated list of users with their followers counts
   */
  static async getUsers(page: number = 0, limit: number = 15) {
    const supabase = await createClient();
    
    const startOffset = page * limit;
    const endOffset = startOffset + limit - 1;

    // Fetch id, username, avatar_url, and followers_count from profiles
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, followers_count')
      .order('followers_count', { ascending: false })
      .range(startOffset, endOffset);

    if (userError) {
      throw new AppError('Error fetching users list.', 500);
    }

    return users;
  }
}
