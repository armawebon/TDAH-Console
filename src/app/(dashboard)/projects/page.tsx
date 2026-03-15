import { createClient } from '@/lib/supabase/server'
import { ProjectCard } from '@/components/projects/project-card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Project, ProjectStatus } from '@/types'

const STATUS_TABS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'inbox',     label: 'Inbox' },
  { value: 'active',    label: 'Activos' },
  { value: 'paused',    label: 'Pausados' },
  { value: 'completed', label: 'Completados' },
]

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { status = 'inbox' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', user!.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: projects } = await query

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects?.length ?? 0} proyectos
          </p>
        </div>
        <Link href="/capture" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="w-4 h-4 mr-1" />
          Capturar idea
        </Link>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/projects?status=${value}`}
            className={cn(buttonVariants({
              variant: status === value ? 'default' : 'outline',
              size: 'sm',
            }))}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Grid de proyectos */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project as Project} />
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
          <Link href="/capture" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Plus className="w-4 h-4 mr-1" />
            Capturar idea
          </Link>
        </div>
      )}
    </div>
  )
}
