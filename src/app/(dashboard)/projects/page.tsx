'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectCard } from '@/components/projects/project-card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus, Loader2 } from 'lucide-react'
import type { Project, ProjectStatus } from '@/types'

const STATUS_TABS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'inbox',     label: 'Inbox' },
  { value: 'active',    label: 'Activos' },
  { value: 'paused',    label: 'Pausados' },
  { value: 'completed', label: 'Completados' },
]

const btn = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-3'
const btnDefault = 'bg-primary text-primary-foreground hover:bg-primary/90'
const btnOutline = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'

export default function ProjectsPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') ?? 'inbox'
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase
        .from('projects')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false })

      if (status !== 'all') query = query.eq('status', status)

      const { data } = await query
      setProjects((data ?? []) as Project[])
      setLoading(false)
    }
    load()
  }, [status])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} proyectos
          </p>
        </div>
        <Link href="/capture" className={cn(btn, btnDefault)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Capturar idea
        </Link>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/projects?status=${value}`}
            className={cn(btn, status === value ? btnDefault : btnOutline)}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Grid de proyectos */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Badge variant="secondary">Sin proyectos</Badge>
          <p className="text-sm text-muted-foreground max-w-xs">
            {status === 'inbox'
              ? 'Tu inbox está vacío. Captura tu primera idea.'
              : `No hay proyectos en estado "${status}".`}
          </p>
          <Link href="/capture" className={cn(btn, btnOutline)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Capturar idea
          </Link>
        </div>
      )}
    </div>
  )
}
