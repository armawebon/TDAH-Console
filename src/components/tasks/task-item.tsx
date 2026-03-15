'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Clock, Zap, Check } from 'lucide-react'
import type { Task } from '@/types'

interface TaskItemProps {
  task: Task
  onStatusChange: (taskId: string, done: boolean) => void
}

export function TaskItem({ task, onStatusChange }: TaskItemProps) {
  const [loading, setLoading] = useState(false)
  const isDone = task.status === 'done'

  const handleToggle = async () => {
    setLoading(true)
    await onStatusChange(task.id, !isDone)
    setLoading(false)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        isDone
          ? 'bg-muted/30 border-muted opacity-60'
          : 'bg-card border-border hover:border-primary/40'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
          isDone
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/40 hover:border-primary'
        )}
        aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {isDone && <Check className="w-3 h-3 text-primary-foreground" />}
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          isDone && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimated_mins} min
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            {task.energy_required}/10
          </span>
        </div>
      </div>
    </div>
  )
}
