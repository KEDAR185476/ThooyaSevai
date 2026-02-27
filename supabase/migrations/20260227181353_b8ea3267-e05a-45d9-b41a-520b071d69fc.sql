-- Allow admins to delete wards
CREATE POLICY "Admins can delete wards"
ON public.wards
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));