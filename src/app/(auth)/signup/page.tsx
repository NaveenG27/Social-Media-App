'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: 'New User', // This matches the trigger we wrote!
        }
      }
    })

    if (error) alert(error.message)
    else alert('Check your email for the confirmation link!')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSignup} className="flex flex-col gap-4 p-8 border rounded-lg">
        <h1 className="text-xl font-bold">Create Account</h1>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          className="border p-2 rounded text-black"
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
          className="border p-2 rounded text-black"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Sign Up
        </button>
      </form>
    </div>
  )
}