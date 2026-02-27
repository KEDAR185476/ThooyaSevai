
-- Add street_name to families table for street-level tracking
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS street_name text;

-- Create family_participation table to track weekly tasks
CREATE TABLE public.family_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  week_start date NOT NULL,
  task_description text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_participation ENABLE ROW LEVEL SECURITY;

-- Students can manage their own family participation records
CREATE POLICY "Students can view own family participation"
  ON public.family_participation FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create participation tasks"
  ON public.family_participation FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own participation"
  ON public.family_participation FOR UPDATE
  USING (auth.uid() = student_id);

-- Admins can view all participation
CREATE POLICY "Admins can view all participation"
  ON public.family_participation FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add unique constraint to prevent duplicate weekly tasks per family
CREATE UNIQUE INDEX family_weekly_task_unique ON public.family_participation (family_id, week_start, task_description);
