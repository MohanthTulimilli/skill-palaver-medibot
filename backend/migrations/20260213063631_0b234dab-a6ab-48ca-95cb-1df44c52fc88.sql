
-- Allow all authenticated users to view active hospitals (for selectors)
CREATE POLICY "Authenticated users view active hospitals"
ON public.hospitals
FOR SELECT
TO authenticated
USING (status = 'ACTIVE');
