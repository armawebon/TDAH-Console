'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, ChevronRight, X, Clock, Zap } from 'lucide-react'
import type { Task } from '@/types'

interface RocketModeProps {
  tasks: Task[]
  projectTitle: string
  onExit: () => void
  onTaskDone: (taskId: string) => void
}

export function RocketMode({ tasks, projectTitle, onExit, onTaskDone }: RocketModeProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [loading, setLoading] = useState(false)

  const pending = localTasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => a.order_index - b.order_index)

  const current = pending[0]
  const done = localTasks.filter((t) => t.status === 'done').length
  const total = localTasks.length
  const progress = Math.round((done / total) * 100)

  const handleDone = async () => {
    if (!current) return
    setLoading(true)

    const res = await fetch(`/api/tasks/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })

    if (res.ok) {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === current.id ? { ...t, status: 'done' } : t))
      )
      onTaskDone(current.id)
      const remaining = pending.length - 1
      if (remaining === 0) {
        toast.success('¡Proyecto completado!')
      }
    } else {
      toast.error('Error al completar la tarea')
    }

    setLoading(false)
  }

  const handleSkip = async () => {
    if (!current) return
    await fetch(`/api/tasks/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'skipped' }),
    })
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === current.id ? { ...t, status: 'skipped' } : t))
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground truncate max-w-xs">{projectTitle}</div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progreso */}
      <div className="w-full max-w-sm mb-8 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{done} de {total} completadas</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {current ? (
        <div className="w-full max-w-sm space-y-6 text-center">
          {/* Etiqueta */}
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Ahora mismo
          </p>

          {/* Tarea actual */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-tight">{current.title}</h2>
            {current.description && (
              <p className="text-muted-foreground text-sm">{current.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {current.estimated_mins} min
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                Energía {current.energy_required}/10
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleDone}
              disabled={loading}
              className="gap-2 h-12 text-base"
            >
              <Check className="w-5 h-5" />
              Listo, siguiente
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="gap-1 text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4" />
              Saltar esta tarea
            </Button>
          </div>

          {/* Siguiente tarea (preview) */}
          {pending[1] && (
            <p className="text-xs text-muted-foreground">
              Siguiente: {pending[1].title}
            </p>
          )}
        </div>
      ) : (
        // Todas completadas
        <div className="text-center space-y-4">
          <div className="text-6xl">🚀</div>
          <h2 className="text-2xl font-semibold">¡Todo completado!</h2>
          <p className="text-muted-foreground">Has terminado todos los pasos del proyecto.</p>
          <Button onClick={onExit}>Volver al proyecto</Button>
        </div>
      )}
    </div>
  )
}
