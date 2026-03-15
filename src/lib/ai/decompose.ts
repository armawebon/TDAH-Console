import { zai, MODEL } from './client'

export interface AtomicTask {
  title: string
  description: string
  estimated_mins: number  // Máximo 20
  energy_required: number // 1-10
  order_index: number
}

const SYSTEM_PROMPT = `Eres un especialista en productividad para personas con TDAH.
Tu función es descomponer proyectos en tareas atómicas, concretas y realizables.
Cada tarea debe poder completarse en menos de 20 minutos sin interrupciones.
Responde SIEMPRE con JSON válido, sin texto adicional, sin markdown.`

export async function decomposeProject(
  title: string,
  description: string | null,
  effortEstimate: string | null
): Promise<AtomicTask[]> {
  const prompt = `
Descompón este proyecto en tareas atómicas para alguien con TDAH.

PROYECTO: "${title}"
DESCRIPCIÓN: "${description ?? 'Sin descripción'}"
TAMAÑO ESTIMADO: ${effortEstimate ?? 'desconocido'}

Reglas CRÍTICAS:
- Cada tarea debe durar MÁXIMO 20 minutos
- Cada tarea debe ser una acción concreta y específica (verbo + objeto)
- Empieza con las tareas más fáciles para ganar momentum
- Máximo 10 tareas (si el proyecto es grande, cubre solo los primeros pasos)
- Evita tareas vagas como "investigar" o "pensar en". Sé específico.

Responde SOLO con este JSON (array, sin texto extra):
[
  {
    "title": "Acción concreta y específica",
    "description": "Instrucción clara de cómo hacerlo (1 frase)",
    "estimated_mins": <número entre 5 y 20>,
    "energy_required": <número 1-10>,
    "order_index": <0, 1, 2...>
  }
]

Ejemplos de tareas BUENAS:
- "Abrir Notion y crear página del proyecto" (5 min)
- "Escribir los 3 objetivos principales en una lista" (10 min)
- "Buscar 2 referencias de diseño en Pinterest" (15 min)

Ejemplos de tareas MALAS:
- "Investigar el tema" (demasiado vago)
- "Planificar todo el proyecto" (demasiado grande)
`

  const response = await zai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1000,
  })

  const content = response.choices[0]?.message?.content ?? '[]'
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const tasks = JSON.parse(cleaned) as AtomicTask[]

  // Asegurar que ninguna tarea supere los 20 minutos
  return tasks.map((t, i) => ({
    ...t,
    estimated_mins: Math.min(t.estimated_mins, 20),
    order_index: i,
  }))
}
