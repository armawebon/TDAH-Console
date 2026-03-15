import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyCapture } from '@/lib/ai/classify'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { raw_content } = body as { raw_content: string }

  if (!raw_content?.trim()) {
    return NextResponse.json({ error: 'Contenido vacío' }, { status: 400 })
  }

  // 1. Guardar captura en estado "processing"
  const { data: capture, error: captureError } = await supabase
    .from('captures')
    .insert({ user_id: user.id, raw_content, status: 'processing' })
    .select()
    .single()

  if (captureError) {
    return NextResponse.json({ error: captureError.message }, { status: 500 })
  }

  // 2. Clasificar con IA
  let classification
  try {
    classification = await classifyCapture(raw_content)
  } catch (err) {
    // Si falla la IA, marcar captura como pendiente para reintentar
    await supabase.from('captures').update({ status: 'pending' }).eq('id', capture.id)
    return NextResponse.json({ error: 'Error al clasificar con IA' }, { status: 500 })
  }

  // 3. Crear proyecto con los datos de la clasificación
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      capture_id: capture.id,
      title: classification.title,
      description: classification.description,
      category: classification.category,
      enthusiasm_score: classification.enthusiasm_score,
      effort_estimate: classification.effort_estimate,
      effort_minutes: classification.effort_minutes,
      energy_required: classification.energy_required,
      tags: classification.tags,
      gravity_weight: classification.gravity_weight,
      status: 'inbox',
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  // 4. Marcar captura como clasificada
  await supabase.from('captures').update({ status: 'classified' }).eq('id', capture.id)

  // 5. Guardar log de clasificación IA
  await supabase.from('ai_classifications').insert({
    capture_id: capture.id,
    project_id: project.id,
    model_used: 'glm-4.7',
    raw_response: classification,
  })

  return NextResponse.json({ capture, project, classification }, { status: 201 })
}
