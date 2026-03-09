-- Tabella per i promemoria intelligenti
CREATE TABLE public.smart_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_type TEXT NOT NULL, -- 'colore', 'taglio', 'trattamento', etc.
    service_name TEXT NOT NULL,
    last_service_date DATE NOT NULL,
    next_suggested_date DATE NOT NULL,
    professional_id UUID,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'dismissed'
    frequency_days INTEGER NOT NULL, -- giorni tra un servizio e l'altro
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.smart_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo i propri promemoria
CREATE POLICY "Users can view own reminders"
ON public.smart_reminders
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: utenti possono creare promemoria
CREATE POLICY "Users can create reminders"
ON public.smart_reminders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: utenti possono aggiornare i propri promemoria
CREATE POLICY "Users can update own reminders"
ON public.smart_reminders
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: professionisti possono vedere promemoria dei loro clienti
CREATE POLICY "Professionals can view client reminders"
ON public.smart_reminders
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.professionals
        WHERE professionals.id = smart_reminders.professional_id
        AND professionals.user_id = auth.uid()
    )
);

-- Funzione per creare promemoria automatici dopo una prenotazione
CREATE OR REPLACE FUNCTION public.create_smart_reminder_after_booking()
RETURNS TRIGGER AS $$
DECLARE
    service_frequency INTEGER;
    service_category TEXT;
BEGIN
    -- Determina la frequenza basata sul tipo di servizio
    SELECT name INTO service_category FROM public.services WHERE id = NEW.service_id;
    
    -- Logica per determinare i giorni di frequenza
    service_frequency := CASE
        WHEN service_category ILIKE '%colore%' OR service_category ILIKE '%tinta%' THEN 45 -- colore ogni 6-7 settimane
        WHEN service_category ILIKE '%taglio%' THEN 30 -- taglio ogni 4-5 settimane  
        WHEN service_category ILIKE '%piega%' THEN 7 -- piega ogni settimana
        WHEN service_category ILIKE '%trattamento%' THEN 21 -- trattamenti ogni 3 settimane
        WHEN service_category ILIKE '%balayage%' OR service_category ILIKE '%meches%' THEN 60 -- ogni 2 mesi
        ELSE 30 -- default
    END;
    
    -- Crea il promemoria solo se la prenotazione è confermata
    IF NEW.status = 'confirmed' THEN
        INSERT INTO public.smart_reminders (
            user_id,
            service_type,
            service_name,
            last_service_date,
            next_suggested_date,
            professional_id,
            frequency_days,
            priority
        ) VALUES (
            NEW.client_id,
            COALESCE(service_category, 'Servizio'),
            COALESCE(service_category, 'Servizio Beauty'),
            NEW.booking_date,
            NEW.booking_date + INTERVAL '1 day' * service_frequency,
            NEW.professional_id,
            service_frequency,
            CASE 
                WHEN service_frequency <= 14 THEN 'high'
                WHEN service_frequency <= 30 THEN 'medium'
                ELSE 'low'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger per creare promemoria automatici
CREATE TRIGGER create_reminder_after_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.create_smart_reminder_after_booking();

-- Funzione per aggiornare timestamp
CREATE TRIGGER update_smart_reminders_updated_at
    BEFORE UPDATE ON public.smart_reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();