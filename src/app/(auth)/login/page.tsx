'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo / Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Focus Flow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu sistema de productividad personalizado
          </p>
        </div>

        {/* Formulario */}
        {!sent ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !email}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                'Acceder con Magic Link'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Te enviaremos un enlace de acceso a tu email. Sin contraseñas.
            </p>
          </form>
        ) : (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl">✉️</div>
            <h2 className="font-semibold">Revisa tu email</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos un enlace a <strong>{email}</strong>.
              <br />Haz clic en él para acceder.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSent(false); setEmail('') }}
            >
              Usar otro email
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
