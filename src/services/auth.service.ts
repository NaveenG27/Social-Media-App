import { createClient } from '@/utils/supabase/server';
import { AppError } from '@/lib/errors';

export class AuthService {
  /**
   * Updates the last login timestamp for the logged in user
   */
  static async updateLastLogin(userId: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update last login:', error.message);
      // We don't throw an error here to prevent blocking the login flow
    }
  }

  /**
   * Retrieves the current authenticated user
   */
  static async getCurrentUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    return user;
  }
}
