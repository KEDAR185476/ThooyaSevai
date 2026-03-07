
-- 1. Trigger: Award 10 points when a new report is created
CREATE OR REPLACE FUNCTION public.award_points_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_points = total_points + 10
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_on_report
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_report();

-- 2. Trigger: Award 20 points when a report is resolved
CREATE OR REPLACE FUNCTION public.award_points_on_resolve()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'resolved' AND NEW.status = 'resolved' THEN
    UPDATE public.profiles
    SET total_points = total_points + 20
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_on_resolve
AFTER UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_resolve();

-- 3. Trigger: Award points when family_participation task is completed
CREATE OR REPLACE FUNCTION public.award_points_on_task_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT with completed = true
  IF TG_OP = 'INSERT' AND NEW.completed = true AND NEW.points_earned > 0 THEN
    UPDATE public.profiles
    SET total_points = total_points + NEW.points_earned
    WHERE user_id = NEW.student_id;
  END IF;
  -- On UPDATE from not completed to completed
  IF TG_OP = 'UPDATE' AND OLD.completed = false AND NEW.completed = true AND NEW.points_earned > 0 THEN
    UPDATE public.profiles
    SET total_points = total_points + NEW.points_earned
    WHERE user_id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_on_task_complete
AFTER INSERT OR UPDATE ON public.family_participation
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_task_complete();

-- 4. Trigger: Auto-upgrade badge level based on total_points
CREATE OR REPLACE FUNCTION public.update_badge_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.total_points >= 500 THEN
    NEW.badge_level := 'platinum';
  ELSIF NEW.total_points >= 200 THEN
    NEW.badge_level := 'gold';
  ELSIF NEW.total_points >= 75 THEN
    NEW.badge_level := 'silver';
  ELSE
    NEW.badge_level := 'bronze';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_badge_level
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
EXECUTE FUNCTION public.update_badge_level();
