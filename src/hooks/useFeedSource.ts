import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export type FeedTab = 'for_you' | 'explore';

export function useFeedSource() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<FeedTab>('for_you');
  const [isFollowingAnyone, setIsFollowingAnyone] = useState<boolean | null>(null);

  const checkFollowingStatus = useCallback(async (userId: string) => {
    try {
      // 1. Efficient query using count matching 'follower_id'
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (!error && count !== null) {
        const hasFollows = count > 0;
        setIsFollowingAnyone(hasFollows);

        // Auto-fallback to explore if no follows
        if (!hasFollows) {
          setActiveTab('explore');
        } else {
          setActiveTab('for_you');
        }
      }
    } catch (e) {
      console.error('Error checking follow status:', e);
    }
  }, [supabase]);

  // Dynamically resolve endpoint
  const getEndpoint = useCallback((page: number = 0, limit: number = 15) => {
    return activeTab === 'explore'
      ? `/api/posts?page=${page}&limit=${limit}`
      : `/api/feed?page=${page}&limit=${limit}`;
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    isFollowingAnyone,
    checkFollowingStatus,
    getEndpoint,
  };
}
