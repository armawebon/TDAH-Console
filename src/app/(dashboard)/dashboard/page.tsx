import { createClient } from '@/lib/supabase/server'
import { Battery, FolderKanban, Inbox, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Stats rápidas (serán dinámicas en fases siguientes)
  const [capturesRes, projectsRes, tasksRes, energyRes] = await Promise.all([
    supabase.from('captures').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'pending'),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'todo'),
    supabase.from('energy_logs').select('energy_level, mood').eq('user_id', user!.id).eq('date', new Date().toISOString().split('T')[0]).single(),
  ])

  const stats = [
    {
      label: 'En Inbox',
      value: capturesRes.count ?? 0,
      icon: Inbox,
      description: 'ideas sin procesar',
      color: 'text-orange-500',
    },
    {
      label: 'Proyectos activos',
      value: projectsRes.count ?? 0,
      icon: FolderKanban,
      description: 'en progreso',
      color: 'text-blue-500',
    },
    {
      label: 'Tareas pendientes',
      value: tasksRes.count ?? 0,
      icon: Zap,
      description: 'para hoy',
      color: 'text-violet-500',
    },
    {
      label: 'Energía hoy',
      value: energyRes.data?.energy_level ?? '—',
      icon: Battery,
      description: energyRes.data?.mood ?? 'sin registrar',
      color: 'text-green-500',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, description, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder para próximas fases */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <Badge variant="secondary">Próximamente</Badge>
          <p className="text-sm text-muted-foreground max-w-xs">
            El panel de priorización inteligente y el motor de gravedad aparecerán aquí en la Fase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
