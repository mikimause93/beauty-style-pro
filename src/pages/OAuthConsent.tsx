import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; logo_uri?: string } | null;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};

// Local typed shim for the beta supabase.auth.oauth namespace.
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

function oauth(): OAuthNamespace {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthNamespace;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("No redirect returned by the authorization server."); }
    window.location.href = target;
  }

  if (error) return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-lg font-semibold">Autorizzazione non disponibile</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </main>
  );
  if (!details) return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Caricamento…</p>
    </main>
  );

  const clientName = details.client?.name ?? "un'app";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 space-y-4">
        <h1 className="text-lg font-bold">Collega {clientName} al tuo account Stayle</h1>
        <p className="text-sm text-muted-foreground">
          {clientName} potrà accedere ai tuoi strumenti Stayle come te. Puoi revocare l'accesso in qualsiasi momento.
        </p>
        {details.scopes && details.scopes.length > 0 && (
          <ul className="text-xs text-muted-foreground list-disc pl-5">
            {details.scopes.map((s) => <li key={s}>{s}</li>)}
          </ul>
        )}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            aria-label="Nega accesso"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 h-11 rounded-xl border border-border/50 text-sm font-medium disabled:opacity-50"
          >
            Nega
          </button>
          <button
            type="button"
            aria-label="Approva accesso"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            Approva
          </button>
        </div>
      </div>
    </main>
  );
}