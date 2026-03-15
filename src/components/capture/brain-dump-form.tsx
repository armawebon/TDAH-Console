'use client'

// Tipos para Web Speech API (webkitSpeechRecognition no está en lib.dom estándar)
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AIClassification } from '@/types'

type Status = 'idle' | 'recording' | 'processing' | 'done'

export function BrainDumpForm() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<AIClassification | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const router = useRouter()

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-ES'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setText(transcript)
      }

      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error('Tu navegador no soporta reconocimiento de voz')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSubmit = async () => {
    if (!text.trim()) return

    setStatus('processing')
    setResult(null)

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: text }),
      })

      if (!res.ok) throw new Error('Error al procesar')

      const data = await res.json()
      setResult(data.classification)
      setStatus('done')
      toast.success('Idea capturada y clasificada')
    } catch {
      setStatus('idle')
      toast.error('Error al procesar la captura')
    }
  }

  const handleReset = () => {
    setText('')
    setResult(null)
    setStatus('idle')
  }

  const handleGoToInbox = () => router.push('/projects')

  return (
    <div className="space-y-6 max-w-2xl">

      {status !== 'done' ? (
        <>
          {/* Área de texto principal */}
          <div className="relative">
            <Textarea
              placeholder="Suelta lo que tienes en la cabeza... puede ser una idea, tarea, proyecto, preocupación, cualquier cosa."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-40 text-base resize-none pr-14 leading-relaxed"
              disabled={status === 'processing'}
              autoFocus
            />
            {/* Botón de voz */}
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'ghost'}
              size="icon"
              onClick={toggleVoice}
              disabled={status === 'processing'}
              className="absolute bottom-3 right-3"
              title={isListening ? 'Detener grabación' : 'Dictar con voz'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>

          {isListening && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
              Escuchando...
            </p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || status === 'processing'}
              className="gap-2"
            >
              {status === 'processing' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Clasificando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Clasificar con IA</>
              )}
            </Button>
            {text && (
              <Button variant="ghost" onClick={handleReset} disabled={status === 'processing'}>
                Limpiar
              </Button>
            )}
          </div>
        </>
      ) : (
        /* Resultado de la clasificación */
        result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{result.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {result.category}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{result.enthusiasm_score}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Entusiasmo</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary uppercase">{result.effort_estimate}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Esfuerzo</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{result.energy_required}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Energía</div>
                </div>
              </div>

              {result.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {result.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground italic border-t pt-3">
                {result.reasoning}
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleGoToInbox}>Ver Inbox</Button>
              <Button variant="outline" onClick={handleReset}>
                Capturar otra idea
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
