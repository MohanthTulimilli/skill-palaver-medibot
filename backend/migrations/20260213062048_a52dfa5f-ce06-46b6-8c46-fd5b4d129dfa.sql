-- Add line items table for invoices to support doctor fee + surgery/procedure costs
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'CONSULTATION',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Super admin full access
CREATE POLICY "Super admin full access invoice_items"
ON public.invoice_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Billing manage invoice items
CREATE POLICY "Billing manage invoice items"
ON public.invoice_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND i.hospital_id = get_user_hospital_id(auth.uid())
  )
  AND has_role(auth.uid(), 'BILLING'::app_role)
);

-- Patients view their own invoice items
CREATE POLICY "Patients view own invoice items"
ON public.invoice_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN patients pt ON pt.id = i.patient_id
    WHERE i.id = invoice_items.invoice_id
    AND pt.user_id = auth.uid()
  )
);

-- Hospital admin manage invoice items
CREATE POLICY "Hospital admin manage invoice items"
ON public.invoice_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND i.hospital_id = get_user_hospital_id(auth.uid())
  )
  AND has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
);