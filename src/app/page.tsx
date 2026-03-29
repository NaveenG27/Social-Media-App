'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { CreatePost } from '@/components/create-post'
import { useEffect, useState, useCallback } from 'react'
import { Trash2, User, Heart, MessageCircle, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

// --- Interfaces ---
interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
}

interface Post {
  id: string
  content: string
  image_url: string | null
  created_at: string
  user_id: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  }
  likes?: { user_id: string }[]
  comments: { id: string }[]
}

// --- Sub-Component: Comment Section ---
function CommentSection({ postId, currentUser, onCommentAdded }: {
  postId: string,
  currentUser: any,
  onCommentAdded: () => void
}) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (!error && data) setComments(data as any)
  }, [postId, supabase])

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: currentUser.id, content: newComment.trim() })
        .select('*, profiles(username, avatar_url)')
        .single()
      
      if (!error && data) {
        setComments(prev => [...prev, data as any])
        setNewComment('')
        onCommentAdded() 
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComments() }, [fetchComments])

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-4 mb-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 text-sm items-start group">
            <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-1 ring-slate-100">
              {comment.profiles?.avatar_url ? (
                <img src={comment.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : <User size={16} className="m-auto mt-2 text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="bg-slate-100/80 px-3 py-2 rounded-2xl rounded-tl-none">
                <p className="font-bold text-xs text-slate-900 mb-0.5">@{comment.profiles?.username || 'user'}</p>
                <p className="text-slate-700 text-sm leading-relaxed">{comment.content}</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">
                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:border-blue-400 transition-colors">
        <input 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          placeholder="Add a comment..." 
          className="flex-1 bg-transparent border-none text-sm px-3 py-1.5 outline-none placeholder:text-slate-400" 
        />
        <Button 
          size="sm" 
          onClick={handleAddComment} 
          disabled={loading || !newComment.trim()} 
          className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-95"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </div>
    </div>
  )
}

import { useFeedSource, FeedTab } from '@/hooks/useFeedSource'

// --- Main Page Component ---
export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [user, setUser] = useState<any>(null)
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [loadingPosts, setLoadingPosts] = useState(true)

  const { activeTab, setActiveTab, isFollowingAnyone, checkFollowingStatus, getEndpoint } = useFeedSource()

  const fetchPosts = useCallback(async (pageNum: number = 0, isAppend = false) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return router.push('/login')
    
    // Check their followers graph exactly once at load if null
    if (isFollowingAnyone === null) {
      await checkFollowingStatus(authUser.id)
    }
    setUser(authUser)

    try {
      const [followingRes, feedRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', authUser.id),
        fetch(getEndpoint(pageNum, 15))
      ])

      if (!followingRes.error) setFollowingIds(followingRes.data?.map(f => f.following_id) || [])
      
      if (feedRes.ok) {
         const json = await feedRes.json()
         setPosts(prev => isAppend ? [...prev, ...json.data] : json.data)
      } else if (feedRes.status === 401) {
         await supabase.auth.signOut()
         router.push('/login')
      } else {
         const text = await feedRes.text()
         console.error("Feed Error:", text)
      }
    } catch (e) { console.error(e) }
    
    setLoadingPosts(false)
  }, [supabase, router, getEndpoint, isFollowingAnyone, checkFollowingStatus])

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('realtime_vibe_home_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase, fetchPosts])

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newLikes = hasLiked ? p.likes?.filter(l => l.user_id !== user.id) : [...(p.likes || []), { user_id: user.id }]
        return { ...p, likes: newLikes }
      }
      return p
    }))
    if (hasLiked) await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id })
    else await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
  }

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return
    const isFollowing = followingIds.includes(targetUserId)
    setFollowingIds(prev => isFollowing ? prev.filter(id => id !== targetUserId) : [...prev, targetUserId])
    if (isFollowing) await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetUserId })
    else await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
  }

  useEffect(() => { fetchPosts() }, [fetchPosts])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-xl mx-auto px-4 h-14 flex justify-between items-center">
          <h1 className="text-2xl font-[900] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">VIBE</h1>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200">
                <User size={18} className="text-slate-600" />
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
              className="text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-6 px-4">
        <div className="mb-6">
          <CreatePost onPostCreated={fetchPosts} />
        </div>

        {/* FEED SELECTION TABS */}
        <div className="flex justify-center gap-3 mb-6">
          <button 
            onClick={() => setActiveTab('for_you')} 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'for_you' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            For You
          </button>
          <button 
            onClick={() => setActiveTab('explore')} 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'explore' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            Explore
          </button>
        </div>

        {activeTab === 'explore' && isFollowingAnyone === false && (
          <div className="bg-blue-50 text-blue-700 border border-blue-100/50 text-sm font-bold px-4 py-3 rounded-2xl mb-6 text-center animate-in fade-in zoom-in duration-300">
            You're not following anyone yet. Showing popular posts!
          </div>
        )}

        <div className="space-y-4">
          {loadingPosts ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-slate-400 text-sm font-medium">Curating your vibe...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center bg-white border border-slate-200/80 rounded-[2rem] shadow-sm">
              <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Your feed is empty</h3>
              <p className="text-slate-500 font-medium max-w-[250px] mt-2">Create your first vibe above or go follow some interesting people!</p>
            </div>
          ) : posts.map((post) => {
            const hasLiked = post.likes?.some(like => like.user_id === user?.id) ?? false
            const isFollowing = followingIds.includes(post.user_id)
            const isOwnPost = user?.id === post.user_id

            return (
              <article 
                key={post.id} 
                className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 overflow-hidden border border-slate-100 shadow-sm">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User size={22} className="m-auto mt-2 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">@{post.profiles?.username || 'user'}</span>
                        {!isOwnPost && (
                          <button 
                            onClick={() => toggleFollow(post.user_id)} 
                            className={`text-[11px] font-bold px-3 py-0.5 rounded-full transition-all border ${
                              isFollowing 
                                ? 'bg-white border-slate-200 text-slate-400' 
                                : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {isOwnPost && (
                    <button 
                      onClick={async () => { if(confirm("Delete this post?")) { await supabase.from('posts').delete().eq('id', post.id); setPosts(p => p.filter(x => x.id !== post.id)) }}} 
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                </div>

                {/* Content */}
                <div className="pl-1">
                  <p className="text-slate-800 mb-4 text-[15px] leading-[1.6] whitespace-pre-wrap font-medium">
                    {post.content}
                  </p>
                  
                  {post.image_url && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 mb-4 shadow-inner">
                      <img 
                        src={post.image_url} 
                        className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-500" 
                        alt="Content" 
                      />
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-1 mt-2">
                  <button 
                    onClick={() => handleLike(post.id, hasLiked)} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all active:scale-90 ${
                      hasLiked ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Heart size={20} fill={hasLiked ? "currentColor" : "none"} strokeWidth={hasLiked ? 0 : 2} />
                    <span className="text-sm font-bold">{post.likes?.length || 0}</span>
                  </button>
                  
                  <button 
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                      expandedComments[post.id] ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <MessageCircle size={20} strokeWidth={2} />
                    <span className="text-sm font-bold">{post.comments?.length || 0}</span>
                  </button>
                  
                </div>

                {/* Expanded Section */}
                {expandedComments[post.id] && user && (
                  <CommentSection 
                    postId={post.id} 
                    currentUser={user} 
                    onCommentAdded={() => fetchPosts()} 
                  />
                )}
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}