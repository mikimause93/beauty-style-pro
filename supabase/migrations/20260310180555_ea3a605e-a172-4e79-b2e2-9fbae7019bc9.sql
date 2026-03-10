
-- Tabella dipendenti business
CREATE TABLE public.business_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'invited',
  invite_token TEXT,
  hired_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log attività dipendenti
CREATE TABLE public.employee_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.business_employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Turni dipendenti
CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.business_employees(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_business_employees_business ON public.business_employees(business_id);
CREATE INDEX idx_business_employees_user ON public.business_employees(user_id);
CREATE INDEX idx_employee_activity_logs_employee ON public.employee_activity_logs(employee_id);
CREATE INDEX idx_employee_shifts_employee ON public.employee_shifts(employee_id);
CREATE INDEX idx_employee_shifts_date ON public.employee_shifts(shift_date);

-- RLS
ALTER TABLE public.business_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

-- business_employees: business owner can do everything
CREATE POLICY "Business owner full access" ON public.business_employees
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
  );

-- Employee can read own record
CREATE POLICY "Employee can read own" ON public.business_employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- activity logs: business owner can read all for their business
CREATE POLICY "Business owner reads logs" ON public.employee_activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_employees be
      JOIN public.businesses b ON b.id = be.business_id
      WHERE be.id = employee_id AND b.user_id = auth.uid()
    )
  );

-- Employee can insert own logs
CREATE POLICY "Employee inserts own logs" ON public.employee_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.business_employees WHERE id = employee_id AND user_id = auth.uid())
  );

-- shifts: business owner full access
CREATE POLICY "Business owner manages shifts" ON public.employee_shifts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid())
  );

-- Employee can read own shifts
CREATE POLICY "Employee reads own shifts" ON public.employee_shifts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.business_employees WHERE id = employee_id AND user_id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER update_business_employees_updated_at
  BEFORE UPDATE ON public.business_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
