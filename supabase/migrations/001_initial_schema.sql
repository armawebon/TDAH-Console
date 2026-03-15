-- =============================================
-- FOCUS FLOW ARCHITECT — Schema inicial v1
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USUARIOS Y CONFIGURACIÓN
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  avatar_url      TEXT,
  timezone        TEXT DEFAULT 'UTC',
  energy_baseline INT DEFAULT 5 CHECK (energy_baseline BETWEEN 1 AND 10),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('google', 'notion', 'antigravity')),
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- =============================================
-- CAPTURA: BRAIN DUMP
-- =============================================

CREATE TABLE IF NOT EXISTS public.captures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  raw_content TEXT NOT NULL,
  input_type  TEXT DEFAULT 'text' CHECK (input_type IN ('text', 'audio', 'voice_transcription')),
  audio_url   TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'classified', 'archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROYECTOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  capture_id       UUID REFERENCES public.captures(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT CHECK (category IN ('work', 'personal', 'learning', 'creative', 'health')),
  enthusiasm_score INT CHECK (enthusiasm_score BETWEEN 1 AND 10),
  effort_estimate  TEXT CHECK (effort_estimate IN ('xs', 's', 'm', 'l', 'xl')),
  effort_minutes   INT,
  priority_score   FLOAT,
  status           TEXT DEFAULT 'inbox' CHECK (status IN ('inbox', 'active', 'paused', 'completed', 'archived')),
  due_date         DATE,
  notion_page_id   TEXT,
  gravity_weight   FLOAT DEFAULT 0.5 CHECK (gravity_weight BETWEEN 0 AND 1),
  energy_required  INT CHECK (energy_required BETWEEN 1 AND 10),
  tags             TEXT[] DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MICRO-TAREAS (Anti-procrastinación)
-- =============================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  estimated_mins  INT DEFAULT 15 CHECK (estimated_mins > 0 AND estimated_mins <= 20),
  is_atomic       BOOLEAN DEFAULT TRUE,
  status          TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'skipped')),
  energy_required INT DEFAULT 5 CHECK (energy_required BETWEEN 1 AND 10),
  order_index     INT DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SESIONES DE ENERGÍA DIARIA
-- =============================================

CREATE TABLE IF NOT EXISTS public.energy_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  logged_at    TIMESTAMPTZ DEFAULT NOW(),
  energy_level INT NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
  mood         TEXT CHECK (mood IN ('focused', 'scattered', 'anxious', 'calm', 'creative')),
  notes        TEXT,
  date         DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- =============================================
-- CACHÉ DE EVENTOS GOOGLE CALENDAR
-- =============================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  title           TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  is_blocking     BOOLEAN DEFAULT FALSE,
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

-- =============================================
-- LOG DE CLASIFICACIONES IA
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_classifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id    UUID REFERENCES public.captures(id) ON DELETE SET NULL,
  project_id    UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  model_used    TEXT,
  prompt_tokens INT,
  output_tokens INT,
  raw_response  JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_captures_user_id ON public.captures(user_id);
CREATE INDEX IF NOT EXISTS idx_captures_status ON public.captures(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_energy_logs_user_date ON public.energy_logs(user_id, date DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_classifications ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuario solo accede a sus propios datos
CREATE POLICY "user_profiles_own" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "user_integrations_own" ON public.user_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "captures_own" ON public.captures
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tasks_own" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "energy_logs_own" ON public.energy_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "calendar_events_own" ON public.calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ai_classifications_own" ON public.ai_classifications
  FOR ALL USING (
    capture_id IN (SELECT id FROM public.captures WHERE user_id = auth.uid())
  );

-- =============================================
-- TRIGGER: Auto-crear user_profile al registrarse
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
