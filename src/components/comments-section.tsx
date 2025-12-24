'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Comment {
  id: string
  text: string
  createdAt: Date
  user: {
    email: string
  }
}

interface CommentsSectionProps {
  jobId: string
  comments: Comment[]
  currentUserId: string | null
}

export function CommentsSection({ jobId, comments, currentUserId }: CommentsSectionProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, text }),
      })

      if (res.ok) {
        setText('') 
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm flex flex-col h-full mt-6">
      <CardHeader className="pb-3 border-b bg-slate-50/50">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-500" />
            <CardTitle>Diskusia ({comments.length})</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    Zatiaľ žiadna diskusia.
                </div>
            ) : (
                comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1 border">
                            <AvatarFallback className="bg-white text-xs font-bold text-slate-700">
                                {comment.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-slate-900">
                                    {comment.user.email.split('@')[0]}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(comment.createdAt), 'dd.MM HH:mm')}
                                </span>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm text-slate-800">
                                {comment.text}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="mt-auto pt-2 flex gap-2 items-end">
            <Textarea 
                placeholder="Napíšte správu..." 
                className="min-h-[60px] resize-none bg-slate-50"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <Button 
                onClick={handleSubmit} 
                disabled={loading || !text.trim()}
                className="h-[60px] w-[60px] bg-slate-900"
            >
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}