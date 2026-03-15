'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskList } from '@/components/tasks/task-list'
import { RocketMode } from '@/components/tasks/rocket-mode'
import { toast } from 'sonner'
import {
  ArrowLeft, Sparkles, Rocket, Loader2,
  Clock, Flame, Zap, Tag
} from 'lucide-react'
import type { Project, Task } from '@/types'

const effortLabels: Record<string, string> = {
  xs: '< 30 min', s: '< 2h', m: '< 1 día', l: '< 1 semana', xl: 'Largo plazo',
}

const statusLabels: Record<string, string> = {
  inbox: 'Inbox', active: 'Activo', paused: 'Pausado',
  completed: 'Completado', archived: 'Archivado',
}

const statusColors: Record<string, string> = {
  inbox:     'secondary',
  active:    'default',
  paused:    'outline',
  completed: 'outline',
  archived:  'outline',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [decomposing, setDecomposing] = useState(false)
  const [rocketMode, setRocketMode] = useState(false)

  const loadData = useCallback(async () => {
    const [{ data: proj }, { data: taskData }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('project_id', id).order('order_index'),
    ])
    if (proj) setProject(proj as Project)
    if (taskData) setTasks(taskData as Task[])
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleDecompose = async () => {
    setDecomposing(true)
    const res = await fetch(`/api/projects/${id}/decompose`, { method: 'POST' })
    if (res.ok) {
      const { tasks: newTasks } = await res.json()
      setTasks(newTasks)
      setProject((p) => p ? { ...p, status: 'active' } : p)
      toast.success(`${newTasks.length} tareas generadas`)
    } else {
      toast.error('Error al generar tareas')
    }
    setDecomposing(false)
  }

  const handleTaskDone = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Proyecto no encontrado.</p>
        <Button variant="ghost" onClick={() => router.push('/projects')} className="mt-2">
          Volver
        </Button>
      </div>
    )
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'skipped')

  return (
    <>
      {/* Modo Cohete — pantalla completa */}
      {rocketMode && (
        <RocketMode
          tasks={tasks}
          projectTitle={project.title}
          onExit={() => setRocketMode(false)}
          onTaskDone={handleTaskDone}
        />
      )}

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/projects')}
          className="gap-1.5 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Proyectos
        </Button>

        {/* Header del proyecto */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 justify-between">
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">
              {project.title}
            </h1>
            <Badge variant={statusColors[project.status] as 'default' | 'secondary' | 'outline'}>
              {statusLabels[project.status]}
            </Badge>
          </div>

          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}

          {/* Métricas */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {project.enthusiasm_score && (
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Entusiasmo {project.enthusiasm_score}/10
              </span>
            )}
            {project.effort_estimate && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {effortLabels[project.effort_estimate]}
              </span>
            )}
            {project.energy_required && (
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                Energía {project.energy_required}/10
              </span>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap items-center">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sección de tareas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pasos</h2>
            <div className="flex gap-2">
              {tasks.length > 0 && pendingTasks.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRocketMode(true)}
                  className="gap-1.5"
                >
                  <Rocket className="w-4 h-4" />
                  Modo Cohete
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleDecompose}
                disabled={decomposing}
                className="gap-1.5"
              >
                {decomposing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />{tasks.length > 0 ? 'Regenerar' : 'Generar pasos'}</>
                )}
              </Button>
            </div>
          </div>

          {tasks.length > 0 ? (
            <TaskList initialTasks={tasks} />
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Aún no hay pasos generados para este proyecto.
              </p>
              <Button size="sm" onClick={handleDecompose} disabled={decomposing} className="gap-1.5">
                {decomposing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                  : <><Sparkles className="w-4 h-4" /> Generar pasos con IA</>
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
