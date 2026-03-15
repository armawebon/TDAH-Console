import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Zap, Clock, Flame } from 'lucide-react'
import type { Project } from '@/types'

const categoryColors: Record<string, string> = {
  work:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  personal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  learning: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  creative: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  health:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const effortLabels: Record<string, string> = {
  xs: '< 30 min',
  s:  '< 2h',
  m:  '< 1 día',
  l:  '< 1 semana',
  xl: 'largo plazo',
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const categoryClass = project.category
    ? categoryColors[project.category]
    : 'bg-muted text-muted-foreground'

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-snug line-clamp-2">{project.title}</h3>
            {project.category && (
              <Badge
                variant="outline"
                className={`text-xs shrink-0 capitalize ${categoryClass}`}
              >
                {project.category}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {project.enthusiasm_score && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {project.enthusiasm_score}/10
              </span>
            )}
            {project.effort_estimate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {effortLabels[project.effort_estimate]}
              </span>
            )}
            {project.energy_required && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                {project.energy_required}/10
              </span>
            )}
          </div>

          {project.tags && project.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
