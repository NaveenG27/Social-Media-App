'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      router.push('/') 
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] p-4 font-sans selection:bg-blue-100 relative overflow-hidden">
      {/* Top accent bar for a premium touch */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          
          <div className="p-8 pb-4 text-center">
            {/* Logo branding consistent with Signup */}
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-6 shadow-xl shadow-blue-100 transform -rotate-3 transition-transform hover:rotate-0">
              <Sparkles className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-400 text-sm mt-2">Ready to see what's happening?</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 pt-4 space-y-5">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-12 pl-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-black"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-wider text-slate-400">Password</Label>
                  
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="h-12 pl-12 pr-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Login
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="pt-6 text-center border-t border-slate-50">
              <p className="text-sm text-slate-500">
                New to the platform? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Create an account</Link>
              </p>
            </div>
          </form>
        </div>
        
        {/* Footer branding */}
        <div className="flex justify-center gap-6 mt-10">
           <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Privacy</p>
           <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Terms</p>
           <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Help</p>
        </div>
      </div>
    </div>
  )
}