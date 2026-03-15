'use client'

import { useState } from 'react'
import { TaskItem } from './task-item'
import { toast } from 'sonner'
import type { Task } from '@/types'

interface TaskListProps {
  initialTasks: Task[]
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const handleStatusChange = async (taskId: string, done: boolean) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: done ? 'done' : 'todo' }),
    })

    if (!res.ok) {
      toast.error('Error al actualizar la tarea')
      return
    }

    const updated = await res.json() as Task
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))

    if (done) {
      const remaining = tasks.filter((t) => t.id !== taskId && t.status !== 'done').length
      if (remaining === 0) {
        toast.success('¡Proyecto completado! Todos los pasos terminados.')
      } else {
        toast.success(`Tarea completada. Quedan ${remaining} pasos.`)
      }
    }
  }

  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{done} de {total} completadas</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Lista de tareas ordenada */}
      <div className="space-y-2">
        {tasks
          .sort((a, b) => a.order_index - b.order_index)
          .map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))}
      </div>
    </div>
  )
}
