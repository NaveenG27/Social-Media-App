'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImagePlus, Loader2 } from 'lucide-react'

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content && !file) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('content', content)
      if (file) {
        formData.append('image', file)
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData, // the browser automatically sets the correct multipart headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Internal Error")
      }

      // 3. Reset form
      setContent('')
      setFile(null)
      onPostCreated() // Refresh the feed
      alert("Post shared!")
      
    } catch (error: any) {
      alert(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-8 border-slate-200">
      <form onSubmit={handleUpload}>
        <CardContent className="pt-6">
          <Textarea 
            placeholder="What's on your mind?" 
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 280))}
            className="resize-none border-none focus-visible:ring-0 text-lg p-0"
          />
          <p className="text-right text-xs text-slate-400 mt-2">
            {content.length}/280
          </p>
          
          {file && (
            <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
              <ImagePlus size={16} /> {file.name}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center">
             <Label htmlFor="image-upload" className="cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
                <ImagePlus className="text-slate-500" size={20} />
                <Input 
                  id="image-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg, image/jpg, image/png, image/webp"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile && selectedFile.size > 2 * 1024 * 1024) {
                      alert("Image is too large! Please select a file under 2MB.")
                      e.target.value = "" // Reset the input
                      setFile(null)
                      return
                    }
                    setFile(selectedFile || null)
                  }}
                />
             </Label>
          </div>
          <Button type="submit" disabled={loading || (!content && !file)}>
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Post
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}