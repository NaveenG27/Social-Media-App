'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, AtSign, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string

    // Validation logic
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      setLoading(false)
      return alert("Username must be 3-30 characters (letters, numbers, and underscores).")
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          first_name,
          last_name,
        },
      },
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Registration successful! Please check your email.")
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-4 font-sans selection:bg-blue-100">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600"></div>
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          
          <div className="p-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Join the Vibe</h1>
            <p className="text-slate-400 text-sm mt-1">Start connecting with developers worldwide</p>
          </div>

          <form onSubmit={handleSignup} className="p-8 pt-4 space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  name="first_name"
                  type="text" 
                  placeholder="First" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <input 
                  name="last_name"
                  type="text" 
                  placeholder="Last" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="relative">
              <AtSign className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                name="username"
                type="text" 
                placeholder="username_01" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                name="email"
                type="email" 
                placeholder="Email address" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                name="password"
                type="password" 
                placeholder="Create password" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-500">
                Have an account? <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700">Log in</Link>
              </p>
            </div>
          </form>
        </div>
        
        <p className="text-center text-[11px] text-slate-400 mt-8 uppercase tracking-widest font-medium">
          Powered by Supabase & Next.js
        </p>
      </div>
    </div>
  )
}