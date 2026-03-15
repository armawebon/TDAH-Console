export type Category = 'work' | 'personal' | 'learning' | 'creative' | 'health'
export type EffortEstimate = 'xs' | 's' | 'm' | 'l' | 'xl'
export type ProjectStatus = 'inbox' | 'active' | 'paused' | 'completed' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type Mood = 'focused' | 'scattered' | 'anxious' | 'calm' | 'creative'
export type IntegrationProvider = 'google' | 'notion' | 'antigravity'

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  timezone: string
  energy_baseline: number
  created_at: string
}

export interface UserIntegration {
  id: string
  user_id: string
  provider: IntegrationProvider
  token_expires_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Capture {
  id: string
  user_id: string
  raw_content: string
  input_type: 'text' | 'audio' | 'voice_transcription'
  audio_url: string | null
  status: 'pending' | 'processing' | 'classified' | 'archived'
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  capture_id: string | null
  title: string
  description: string | null
  category: Category | null
  enthusiasm_score: number | null
  effort_estimate: EffortEstimate | null
  effort_minutes: number | null
  priority_score: number | null
  status: ProjectStatus
  due_date: string | null
  notion_page_id: string | null
  gravity_weight: number
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  estimated_mins: number
  is_atomic: boolean
  status: TaskStatus
  energy_required: number
  order_index: number
  completed_at: string | null
  created_at: string
}

export interface EnergyLog {
  id: string
  user_id: string
  logged_at: string
  energy_level: number
  mood: Mood | null
  notes: string | null
  date: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  google_event_id: string
  title: string | null
  start_time: string
  end_time: string
  is_blocking: boolean
  synced_at: string
}

// IA Classification response
export interface AIClassification {
  title: string
  description: string
  category: Category
  enthusiasm_score: number
  effort_estimate: EffortEstimate
  effort_minutes: number
  energy_required: number
  tags: string[]
  gravity_weight: number
  reasoning: string
}
