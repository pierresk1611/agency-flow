import { useRouter } from 'next/navigation'

export function NotificationsBell() {
  const router = useRouter()
  const [notes, setNotes] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notes.filter(n => !n.isRead).length

  // ... fetch logic exists ...

  const fetchNotes = () => {
    fetch('/api/notifications').then(r => r.json()).then(setNotes)
  }

  useEffect(() => {
    fetchNotes()
    const interval = setInterval(fetchNotes, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAllAsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    fetchNotes()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      setIsOpen(val)
      if (val) markAllAsRead()
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Upozornenia</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">Žiadne nové správy.</p>
          ) : (
            notes.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.link) {
                    setIsOpen(false)
                    router.push(n.link)
                  }
                }}
                className={`p-3 rounded-lg border transition-colors ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-100'
                  } ${n.link ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                <p className="text-xs font-bold">{n.title}</p>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <p className="text-[9px] text-slate-400 mt-2">{format(new Date(n.createdAt), 'dd.MM HH:mm')}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}