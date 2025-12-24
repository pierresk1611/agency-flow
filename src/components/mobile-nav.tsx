'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/sidebar'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function MobileNav({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Keď užívateľ klikne na link a zmení sa adresa, zavrieme menu
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden flex items-center p-4 border-b bg-white sticky top-0 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-slate-900 w-72">
          <Sidebar slug={slug} />
        </SheetContent>
      </Sheet>
      <div className="ml-4 font-bold text-lg tracking-tight">
        Agency<span className="text-blue-500">Flow</span>
      </div>
    </div>
  )
}