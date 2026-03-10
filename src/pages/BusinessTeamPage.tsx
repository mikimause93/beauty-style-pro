import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Plus, Search, UserCheck, UserX, Shield, Clock, MoreVertical, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PERMISSIONS_OPTIONS = [
  { key: "appointments", label: "Gestione Appuntamenti", icon: "📅" },
  { key: "chat", label: "Chat Clienti", icon: "💬" },
  { key: "products", label: "Prodotti / Offerte", icon: "🛍️" },
  { key: "stats", label: "Statistiche", icon: "📊" },
  { key: "calendar", label: "Calendario Turni", icon: "🗓️" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Attivo", color: "bg-success/20 text-success" },
  invited: { label: "Invitato", color: "bg-gold/20 text-gold" },
  disabled: { label: "Disattivato", color: "bg-muted text-muted-foreground" },
};

export default function BusinessTeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "staff", permissions: [] as string[] });

  const { data: business } = useQuery({
    queryKey: ["my_business", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("businesses").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ["business_employees", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase
        .from("business_employees")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!business,
  });

  const addMutation = useMutation({
    mutationFn: async (emp: typeof form) => {
      if (!business) throw new Error("No business");
      const { error } = await supabase.from("business_employees").insert({
        business_id: business.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email || null,
        phone: emp.phone || null,
        role: emp.role,
        permissions: emp.permissions,
        status: "invited",
        invite_token: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_employees"] });
      setShowAdd(false);
      resetForm();
      toast({ title: "Dipendente aggiunto", description: "Invito inviato con successo" });
    },
    onError: () => toast({ title: "Errore", description: "Impossibile aggiungere il dipendente", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("business_employees").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_employees"] });
      toast({ title: "Stato aggiornato" });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions, role }: { id: string; permissions: string[]; role: string }) => {
      const { error } = await supabase.from("business_employees").update({ permissions, role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_employees"] });
      setEditEmployee(null);
      toast({ title: "Permessi aggiornati", description: "Le modifiche sono state salvate" });
    },
    onError: () => toast({ title: "Errore", description: "Impossibile aggiornare i permessi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_employees"] });
      toast({ title: "Dipendente rimosso" });
    },
  });

  const resetForm = () => setForm({ first_name: "", last_name: "", email: "", phone: "", role: "staff", permissions: [] });

  const togglePermission = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter(p => p !== key) : [...f.permissions, key],
    }));
  };

  const filtered = (employees || []).filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/business")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Gestione Staff</h1>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cerca dipendente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Totale", value: employees?.length || 0 },
            { label: "Attivi", value: employees?.filter(e => e.status === "active").length || 0 },
            { label: "Invitati", value: employees?.filter(e => e.status === "invited").length || 0 },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-xl font-display font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Employee List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(emp => {
              const st = STATUS_MAP[emp.status] || STATUS_MAP.invited;
              return (
                <div key={emp.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{emp.first_name} {emp.last_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{emp.role === "manager" ? "Manager" : "Staff"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {emp.email && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Mail className="w-3 h-3" />{emp.email}</span>}
                        {emp.phone && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Phone className="w-3 h-3" />{emp.phone}</span>}
                      </div>
                      {emp.permissions && emp.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {emp.permissions.map((p: string) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium">
                              {PERMISSIONS_OPTIONS.find(o => o.key === p)?.label || p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {emp.status === "invited" && (
                        <button onClick={() => updateStatusMutation.mutate({ id: emp.id, status: "active" })} className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20">
                          <UserCheck className="w-4 h-4 text-success" />
                        </button>
                      )}
                      {emp.status === "active" && (
                        <button onClick={() => updateStatusMutation.mutate({ id: emp.id, status: "disabled" })} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20">
                          <UserX className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                      {emp.status === "disabled" && (
                        <button onClick={() => updateStatusMutation.mutate({ id: emp.id, status: "active" })} className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20">
                          <UserCheck className="w-4 h-4 text-success" />
                        </button>
                      )}
                      <button onClick={() => deleteMutation.mutate(emp.id)} className="p-1.5 rounded-lg bg-muted hover:bg-destructive/10">
                        <UserX className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-card border border-dashed border-border text-center">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold">Nessun dipendente</p>
            <p className="text-xs text-muted-foreground mt-1">Aggiungi il tuo primo membro del team</p>
            <Button onClick={() => { resetForm(); setShowAdd(true); }} className="mt-4 rounded-full" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Aggiungi Dipendente
            </Button>
          </div>
        )}
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Aggiungi Dipendente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nome" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              <Input placeholder="Cognome" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
            <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input type="tel" placeholder="Telefono / WhatsApp" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Ruolo</p>
              <div className="flex gap-2">
                {["staff", "manager"].map(r => (
                  <button
                    key={r}
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${form.role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {r === "manager" ? "👔 Manager" : "👤 Staff"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Permessi</p>
              <div className="space-y-1.5">
                {PERMISSIONS_OPTIONS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => togglePermission(p.key)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${form.permissions.includes(p.key) ? "bg-primary/10 border border-primary/30 text-primary" : "bg-muted/50 border border-transparent text-muted-foreground"}`}
                  >
                    <span>{p.icon}</span>
                    <span className="font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full rounded-xl"
              disabled={!form.first_name || !form.last_name || addMutation.isPending}
              onClick={() => addMutation.mutate(form)}
            >
              {addMutation.isPending ? "Invio..." : "Invia Invito"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
