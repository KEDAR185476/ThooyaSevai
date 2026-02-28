
-- Street assignments: students claim a street with invite code
CREATE TABLE public.street_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  street_name text NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.street_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own street assignment"
ON public.street_assignments FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Anyone can view street assignments"
ON public.street_assignments FOR SELECT
USING (true);

-- Add neighbor_user_id to families for self-registered neighbors
ALTER TABLE public.families ADD COLUMN neighbor_user_id uuid;
