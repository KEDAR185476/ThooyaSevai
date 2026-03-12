
-- Re-create all triggers (functions already exist)

-- 1. Award 10 points on new report
DROP TRIGGER IF EXISTS trg_award_points_on_report ON public.reports;
CREATE TRIGGER trg_award_points_on_report
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_report();

-- 2. Award 20 points on report resolved
DROP TRIGGER IF EXISTS trg_award_points_on_resolve ON public.reports;
CREATE TRIGGER trg_award_points_on_resolve
AFTER UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_resolve();

-- 3. Award points on task completion
DROP TRIGGER IF EXISTS trg_award_points_on_task_complete ON public.family_participation;
CREATE TRIGGER trg_award_points_on_task_complete
AFTER INSERT OR UPDATE ON public.family_participation
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_task_complete();

-- 4. Auto-update badge level
DROP TRIGGER IF EXISTS trg_update_badge_level ON public.profiles;
CREATE TRIGGER trg_update_badge_level
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
EXECUTE FUNCTION public.update_badge_level();

-- 5. Deduct points on reward redemption
CREATE OR REPLACE FUNCTION public.deduct_points_on_redemption()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _points_required integer;
  _current_points integer;
BEGIN
  SELECT points_required INTO _points_required FROM public.rewards WHERE id = NEW.reward_id;
  SELECT total_points INTO _current_points FROM public.profiles WHERE user_id = NEW.user_id;
  
  IF _current_points < _points_required THEN
    RAISE EXCEPTION 'Not enough points to redeem this reward';
  END IF;
  
  UPDATE public.profiles
  SET total_points = total_points - _points_required
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deduct_points_on_redemption ON public.redemptions;
CREATE TRIGGER trg_deduct_points_on_redemption
BEFORE INSERT ON public.redemptions
FOR EACH ROW
EXECUTE FUNCTION public.deduct_points_on_redemption();
