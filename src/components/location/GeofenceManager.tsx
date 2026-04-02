/**
 * GeofenceManager.tsx — Beauty Style Pro v2.0.0
 * Gestione zone geofence per saloni: crea, attiva/disattiva e mostra alert.
 */

import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Geofence, isInsideGeofence } from "@/services/locationService";
import { useLocationLive } from "@/hooks/useLocationLive";
import { toast } from "sonner";

export default function GeofenceManager() {
  const { user } = useAuth();
  const { currentPosition } = useLocationLive();
  const [fences, setFences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", radiusM: 500 });

  const loadFences = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("geofences")
      .select("*")
      .eq("owner_id", user.id);
    setIsLoading(false);
    if (error) {
      toast.error("Errore caricamento geofence");
      return;
    }
    setFences(
      (data ?? []).map(row => ({
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        radiusM: row.radius_m,
        triggerType: row.trigger_type,
        active: row.active,
      })),
    );
  }, [user?.id]);

  useEffect(() => { loadFences(); }, [loadFences]);

  // Controlla geofence quando la posizione cambia
  useEffect(() => {
    if (!currentPosition) return;
    fences.filter(f => f.active).forEach(fence => {
      if (isInsideGeofence(currentPosition, fence)) {
        toast(`📍 Sei entrato in: ${fence.name}`, { duration: 4000 });
      }
    });
  }, [currentPosition, fences]);

  const createFence = useCallback(async () => {
    if (!user?.id || !currentPosition) {
      toast.error("Serve la posizione attuale per creare una geofence");
      return;
    }
    const { error } = await supabase.from("geofences").insert({
      owner_id: user.id,
      name: form.name || "Mia zona",
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      radius_m: form.radiusM,
      trigger_type: "enter",
      active: true,
    });
    if (error) { toast.error("Errore creazione geofence"); return; }
    toast.success("Geofence creata!");
    setShowForm(false);
    setForm({ name: "", radiusM: 500 });
    loadFences();
  }, [user?.id, currentPosition, form, loadFences]);

  const toggleFence = useCallback(async (fence: Geofence) => {
    const { error } = await supabase
      .from("geofences")
      .update({ active: !fence.active })
      .eq("id", fence.id);
    if (error) { toast.error("Errore aggiornamento"); return; }
    setFences(prev => prev.map(f => f.id === fence.id ? { ...f, active: !f.active } : f));
  }, []);

  const deleteFence = useCallback(async (id: string) => {
    const { error } = await supabase.from("geofences").delete().eq("id", id);
    if (error) { toast.error("Errore eliminazione"); return; }
    setFences(prev => prev.filter(f => f.id !== id));
    toast.success("Geofence eliminata");
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold">Zone Geofence</h3>
          <p className="text-xs text-muted-foreground">Alert quando entri in una zona</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(o => !o)}
          className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Form creazione */}
      {showForm && (
        <div className="bg-muted rounded-xl p-3 space-y-3">
          <input
            type="text"
            placeholder="Nome zona (es. Il mio salone)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-background rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground shrink-0">Raggio (m):</label>
            <input
              type="number"
              min={50}
              max={5000}
              value={form.radiusM}
              onChange={e => setForm(f => ({ ...f, radiusM: Number(e.target.value) }))}
              className="flex-1 bg-background rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {!currentPosition && (
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Avvia il tracking per usare la posizione attuale
            </p>
          )}
          <button
            type="button"
            onClick={createFence}
            disabled={!currentPosition}
            className="w-full py-2 rounded-lg bg-purple-600 text-white text-sm font-medium disabled:opacity-40"
          >
            Crea geofence qui
          </button>
        </div>
      )}

      {/* Lista geofence */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Caricamento...</p>
      ) : fences.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nessuna geofence. Crea la prima!
        </p>
      ) : (
        <div className="space-y-2">
          {fences.map(fence => (
            <div
              key={fence.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                fence.active ? "border-orange-500/30 bg-orange-500/5" : "border-border bg-muted"
              }`}
            >
              <MapPin className={`w-4 h-4 shrink-0 ${fence.active ? "text-orange-400" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{fence.name}</p>
                <p className="text-[10px] text-muted-foreground">Raggio: {fence.radiusM}m</p>
              </div>
              <button type="button" onClick={() => toggleFence(fence)} className="shrink-0">
                {fence.active ? (
                  <ToggleRight className="w-5 h-5 text-orange-400" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              <button
                type="button"
                onClick={() => deleteFence(fence.id)}
                className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
