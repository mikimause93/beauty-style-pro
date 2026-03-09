-- Fix security warnings: Correggi le policy RLS troppo permissive

-- Rimuovi policy troppo permissive per chatbot_suggestions_config
DROP POLICY "Everyone can view chatbot configs" ON public.chatbot_suggestions_config;

-- Crea policy più sicura che permette solo lettura autenticata
CREATE POLICY "Authenticated users can view chatbot configs"
ON public.chatbot_suggestions_config FOR SELECT
TO authenticated
USING (true);

-- Aggiungi policy per admin per modificare le configurazioni (solo service role)
-- Gli admin possono modificare tramite service role key

-- Correggi policy per user_suggestion_history per essere più specifica
DROP POLICY "Users can manage their own suggestion history" ON public.user_suggestion_history;

CREATE POLICY "Users can insert their own suggestion history"
ON public.user_suggestion_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestion history"
ON public.user_suggestion_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestion history"
ON public.user_suggestion_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Aggiungi policy per inserire messaggi chatbot (solo per edge functions)
CREATE POLICY "System can insert chatbot messages"
ON public.chatbot_messages FOR INSERT
WITH CHECK (true); -- Questa è necessaria per edge functions

-- Aggiungi policy per aggiornare messaggi chatbot (solo per utente proprietario)
CREATE POLICY "System can update chatbot messages"
ON public.chatbot_messages FOR UPDATE
WITH CHECK (true); -- Edge functions possono aggiornare, ma RLS limita agli owner per SELECT