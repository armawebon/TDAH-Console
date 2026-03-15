import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decomposeProject } from '@/lib/ai/decompose'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que el proyecto pertenece al usuario
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, effort_estimate, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  // Borrar tareas previas si las hay (re-desglose)
  await supabase.from('tasks').delete().eq('project_id', id)

  // Generar tareas atómicas con IA
  let atomicTasks
  try {
    atomicTasks = await decomposeProject(
      project.title,
      project.description,
      project.effort_estimate
    )
  } catch {
    return NextResponse.json({ error: 'Error al generar tareas con IA' }, { status: 500 })
  }

  // Insertar tareas en DB
  const tasksToInsert = atomicTasks.map((t) => ({
    project_id: id,
    user_id: user.id,
    title: t.title,
    description: t.description,
    estimated_mins: t.estimated_mins,
    energy_required: t.energy_required,
    order_index: t.order_index,
    is_atomic: true,
    status: 'todo',
  }))

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select()

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  // Activar el proyecto
  await supabase
    .from('projects')
    .update({ status: 'active' })
    .eq('id', id)

  return NextResponse.json({ tasks }, { status: 201 })
}
