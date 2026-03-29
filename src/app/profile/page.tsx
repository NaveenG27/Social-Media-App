'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  Trash2, ArrowLeft, Loader2, MessageCircle, Send, 
  Heart, MapPin, Link as LinkIcon, Camera, Edit3, 
  MoreVertical, Calendar
} from 'lucide-react'
import Link from 'next/link'

const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Naveen",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Naveen",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Naveen",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Naveen"
];

const getAvatarFallback = (username: string) => {
  const seed = username || 'fresher';
  const styles = ['avataaars', 'bottts', 'lorelei', 'pixel-art'];
  const selectedStyle = styles[seed.length % 4]; 
  return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string };
}

interface Post {
  id: string
  content: string
  image_url: string | null
  created_at: string
  user_id: string
  like_count: number    
  comment_count: number
}

const POSTS_PER_PAGE = 5;

function CommentSection({ postId, currentUserId, onCommentAdded }: { 
  postId: string, 
  currentUserId: string,
  onCommentAdded: () => void 
}) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles!user_id(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (data) setComments(data as any)
  }, [postId, supabase])

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: currentUserId, content: newComment.trim() })
        .select('*, profiles!user_id(username, avatar_url)')
        .single()
      if (data) {
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
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 text-sm items-start">
            <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                <img src={comment.profiles?.avatar_url || getAvatarFallback(comment.profiles?.username)} className="h-full w-full object-cover" alt="" />
            </div>
            <div className="flex-1 bg-slate-50 p-3 rounded-2xl rounded-tl-none">
                <p className="font-extrabold text-[11px] text-blue-600 mb-1">@{comment.profiles?.username}</p>
                <p className="text-slate-700 text-xs leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:ring-2 ring-blue-100 transition-all">
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 bg-transparent text-xs px-3 outline-none" />
        <Button size="sm" onClick={handleAddComment} disabled={loading || !newComment.trim()} className="h-8 w-8 p-0 bg-blue-600 rounded-full">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPostCount, setTotalPostCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null) 
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts')
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [editForm, setEditForm] = useState({ 
    first_name: '', 
    last_name: '', 
    bio: '', 
    location: '', 
    website: '', 
    avatar_url: '' 
  })
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editPostContent, setEditPostContent] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // FETCH POSTS WITH DUPLICATE KEY PROTECTION
  const fetchUserPosts = useCallback(async (isInitial = false) => {
    if (!user?.id) return
    setLoadingMore(true)
    const currentPage = isInitial ? 0 : page
    const from = currentPage * POSTS_PER_PAGE
    const to = from + POSTS_PER_PAGE - 1

    const { data, error } = await supabase
      .from('posts')
      .select('*, like_count, comment_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setPosts(prev => {
        const fetchedPosts = data as Post[]
        if (isInitial) return fetchedPosts
        
        // Prevent duplicates when clicking "Show More"
        const existingIds = new Set(prev.map(p => p.id))
        const uniqueNewPosts = fetchedPosts.filter(p => !existingIds.has(p.id))
        return [...prev, ...uniqueNewPosts]
      })
      setHasMore(data.length === POSTS_PER_PAGE)
      setPage(isInitial ? 1 : currentPage + 1)
    }
    setLoadingMore(false)
  }, [user?.id, page, supabase])

  // INITIAL LOAD AND DATA RESET
  const loadProfileData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return router.push('/login')
    setUser(authUser)

    const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id)
    setTotalPostCount(count || 0)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
    
    if (profileData) {
      setProfile(profileData)
      setEditForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        avatar_url: profileData.avatar_url || ''
      })
    }

    // Refresh only the first page and reset state to avoid duplicate keys during real-time sync
    const { data: postData } = await supabase.from('posts')
      .select('*, like_count, comment_count')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .range(0, (page > 0 ? page * POSTS_PER_PAGE : POSTS_PER_PAGE) - 1)

    if (postData) { 
      setPosts(postData as Post[])
      setHasMore(postData.length === POSTS_PER_PAGE)
    }

    // Follows
    const { data: fers } = await supabase.from('follows').select('follower_id').eq('following_id', authUser.id)
    if (fers?.length) {
      const { data: profs } = await supabase.from('profiles').select('username, avatar_url').in('id', fers.map(f => f.follower_id))
      setFollowers(profs || [])
    }
    const { data: fing } = await supabase.from('follows').select('following_id').eq('follower_id', authUser.id)
    if (fing?.length) {
      const { data: profs } = await supabase.from('profiles').select('username, avatar_url').in('id', fing.map(f => f.following_id))
      setFollowing(profs || [])
    }
    setLoading(false)
  }, [supabase, router, page])

  useEffect(() => { loadProfileData() }, [loadProfileData])

  // REAL-TIME SYNC
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${user.id}` }, () => loadProfileData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => loadProfileData())
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [user?.id, supabase, loadProfileData]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      if (!event.target.files?.[0] || !user) return
      const file = event.target.files[0]
      
      const formData = new FormData()
      formData.append('avatar', file)
      
      const res = await fetch('/api/users/me', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setEditForm(prev => ({ ...prev, avatar_url: data.avatar_url }))
      setProfile((prev: any) => ({ ...prev, avatar_url: data.avatar_url }))
    } catch (error: any) {
      alert(error.message)
    } finally { 
      setUploadingAvatar(false) 
    }
  }

  const handleUpdateProfile = async () => {
    const { data, error } = await supabase.from('profiles').update({
      ...editForm,
      full_name: `${editForm.first_name} ${editForm.last_name}`.trim()
    }).eq('id', user.id).select().single()
    
    if (!error) { setProfile(data); setIsEditing(false) }
  }

  const handleEditPost = async (postId: string) => {
    if (!editPostContent.trim()) return
    const { error } = await supabase.from('posts').update({ content: editPostContent.trim() }).eq('id', postId)
    if (!error) {
      setEditingPostId(null)
      setOpenMenuId(null)
    }
  }

  const UserList = ({ list, emptyMsg }: { list: any[], emptyMsg: string }) => (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
      {list.length > 0 ? list.map((u, i) => (
        <div key={i} className="flex items-center gap-4 p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
          <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <img src={u.avatar_url || getAvatarFallback(u.username)} className="h-full w-full object-cover" alt="" />
          </div>
          <p className="font-extrabold text-sm text-slate-900 tracking-tight">@{u.username}</p>
        </div>
      )) : <div className="p-16 text-center text-slate-400 text-sm font-medium">{emptyMsg}</div>}
    </div>
  )

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><ArrowLeft size={20} /></Link>
            <h1 className="text-lg font-black tracking-tight uppercase">Profile</h1>
          </div>
          <Button variant={isEditing ? "ghost" : "default"} size="sm" onClick={() => setIsEditing(!isEditing)} className="rounded-full font-bold px-6 shadow-sm">
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="relative h-32 w-32 rounded-full bg-slate-100 overflow-hidden ring-4 ring-white shadow-xl group cursor-pointer shrink-0" onClick={() => !uploadingAvatar && fileInputRef.current?.click()}>
              {uploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"><Loader2 className="animate-spin text-white" /></div>}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><Camera className="text-white" /></div>
              <img src={(isEditing ? editForm.avatar_url : profile?.avatar_url) || getAvatarFallback(profile?.username)} className="h-full w-full object-cover" alt="" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

            <div className="flex-1 space-y-3">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-center md:justify-start gap-2 mb-4">
                    {DEFAULT_AVATARS.map((url, idx) => (
                      <button key={idx} onClick={() => setEditForm({...editForm, avatar_url: url})} className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all ${editForm.avatar_url === url ? 'border-blue-600 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}>
                        <img src={url} alt="preset" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" className="p-3 bg-slate-50 rounded-xl text-sm outline-none border border-slate-200" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} placeholder="First Name" />
                    <input type="text" className="p-3 bg-slate-50 rounded-xl text-sm outline-none border border-slate-200" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} placeholder="Last Name" />
                  </div>

                  <textarea maxLength={160} className="w-full p-3 bg-slate-50 rounded-2xl text-sm outline-none border border-slate-200" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Bio..." />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" className="p-3 bg-slate-50 rounded-xl text-sm outline-none border border-slate-200" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="Location" />
                    <input type="url" className="p-3 bg-slate-50 rounded-xl text-sm outline-none border border-slate-200" value={editForm.website} onChange={e => setEditForm({...editForm, website: e.target.value})} placeholder="Website URL" />
                  </div>
                  <Button onClick={handleUpdateProfile} className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl font-bold h-12">Update Profile</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900">@{profile?.username}</h2>
                    {(profile?.first_name || profile?.last_name) && (
                      <p className="text-blue-600 font-extrabold text-sm uppercase tracking-wide">
                        {profile.first_name} {profile.last_name}
                      </p>
                    )}
                    <p className="text-slate-500 font-medium leading-relaxed max-w-md">{profile?.bio || "Digital creator in the making. No bio yet."}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                    {profile?.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {profile.location}</span>}
                    {profile?.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors underline decoration-blue-200"><LinkIcon size={14} /> Website</a>}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-around md:justify-start md:gap-16 mt-10 pt-8 border-t border-slate-50">
            {[
              { label: 'Posts', count: totalPostCount, tab: 'posts' },
              { label: 'Followers', count: followers.length, tab: 'followers' },
              { label: 'Following', count: following.length, tab: 'following' }
            ].map(item => (
              <button key={item.tab} onClick={() => setActiveTab(item.tab as any)} className={`group transition-all ${activeTab === item.tab ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}>
                <p className="font-black text-2xl tracking-tighter">{item.count}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 group-hover:text-blue-500">{item.label}</p>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'posts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                {post.image_url && <div className="w-full aspect-[16/9] bg-slate-100 overflow-hidden border-b border-slate-50"><img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Post" /></div>}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    
                    {/* CUSTOM DROPDOWN (ONLY ONE HERE) */}
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openMenuId === post.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                            <button 
                              onClick={() => { setEditingPostId(post.id); setEditPostContent(post.content); setOpenMenuId(null); }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button 
                              onClick={async () => { if(confirm("Delete this vibe?")) { await supabase.from('posts').delete().eq('id', post.id); } setOpenMenuId(null); }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {editingPostId === post.id ? (
                    <div className="space-y-3">
                      <textarea maxLength={280} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none" value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} />
                      <div className="flex justify-end gap-2"><Button size="sm" variant="ghost" className="rounded-full" onClick={() => setEditingPostId(null)}>Cancel</Button><Button size="sm" onClick={() => handleEditPost(post.id)} className="rounded-full bg-blue-600">Save</Button></div>
                    </div>
                  ) : <p className="text-slate-800 text-[15px] font-medium leading-[1.6] mb-6 whitespace-pre-wrap">{post.content}</p>}

                  <div className="flex items-center gap-6 pt-5 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-1.5 rounded-full font-black text-xs"><Heart size={16} fill="currentColor" /> <span>{post.like_count || 0}</span></div>
                    <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="flex items-center gap-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 px-4 py-1.5 rounded-full transition-all text-xs font-black"><MessageCircle size={16} /> <span>{post.comment_count || 0} Comments</span></button>
                  </div>
                  {expandedComments[post.id] && <CommentSection postId={post.id} currentUserId={user?.id} onCommentAdded={() => loadProfileData()} />}
                </div>
              </div>
            ))}
            {hasMore && posts.length > 0 && (
              <Button onClick={() => fetchUserPosts()} disabled={loadingMore} variant="outline" className="w-full border-slate-200 text-slate-500 font-black rounded-2xl py-8">
                {loadingMore ? <Loader2 className="animate-spin" /> : "SHOW MORE VIBES"}
              </Button>
            )}
          </div>
        )}
        {activeTab === 'followers' && <UserList list={followers} emptyMsg="No one is following you yet." />}
        {activeTab === 'following' && <UserList list={following} emptyMsg="You aren't following anyone yet." />}
      </main>
    </div>
  )
}