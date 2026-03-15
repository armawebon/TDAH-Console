import { zai, MODEL } from './client'
import type { AIClassification } from '@/types'

const SYSTEM_PROMPT = `Eres un asistente especializado en productividad para personas con TDAH.
Tu única función es analizar ideas o tareas capturadas y extraer información estructurada.
Responde SIEMPRE con JSON válido, sin texto adicional, sin markdown, sin bloques de código.`

const buildPrompt = (rawContent: string) => `
Analiza esta idea o tarea capturada y extrae información estructurada.

INPUT: "${rawContent}"

Responde SOLO con este JSON (sin texto extra, sin bloques de código):
{
  "title": "Título conciso (máximo 60 caracteres)",
  "description": "Qué es esto en 1-2 frases claras",
  "category": "work|personal|learning|creative|health",
  "enthusiasm_score": <número 1-10, qué tan emocionante parece>,
  "effort_estimate": "xs|s|m|l|xl",
  "effort_minutes": <estimación total en minutos>,
  "energy_required": <número 1-10, energía mental necesaria>,
  "tags": ["tag1", "tag2"],
  "gravity_weight": <número 0.0-1.0, urgencia/importancia>,
  "reasoning": "Por qué asignaste estos valores (1 frase)"
}

Guía de effort_estimate:
- xs = menos de 30 minutos
- s = 30 min a 2 horas
- m = 2 horas a 1 día
- l = 1 día a 1 semana
- xl = más de 1 semana o indefinido

Guía de gravity_weight:
- 1.0 = urgente e importante, no puede esperar
- 0.5 = importante pero sin urgencia inmediata
- 0.0 = puede esperar indefinidamente
`

export async function classifyCapture(rawContent: string): Promise<AIClassification> {
  const response = await zai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(rawContent) },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })

  const content = response.choices[0]?.message?.content ?? ''

  // Limpiar posibles bloques de código que el modelo pueda añadir
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsed = JSON.parse(cleaned) as AIClassification
  return parsed
}
