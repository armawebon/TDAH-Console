'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Zap,
  Inbox,
  FolderKanban,
  Battery,
  Gauge,
  Settings,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: Gauge },
  { href: '/capture',    label: 'Capturar',   icon: Inbox },
  { href: '/projects',   label: 'Proyectos',  icon: FolderKanban },
  { href: '/energy',     label: 'Energía',    icon: Battery },
  { href: '/gravity',    label: 'Gravedad',   icon: Zap },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen border-r bg-background flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Focus Flow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
          Ajustes
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </Button>
      </div>
    </aside>
  )
}
