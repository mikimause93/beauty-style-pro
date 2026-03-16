import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Plus, Calendar, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";

export default function EmployeeShiftsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [shiftForm, setShiftForm] = useState({ employee_id: "", shift_date: "", start_time: "09:00", end_time: "18:00" });

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: business } = useQuery({
    queryKey: ["my_business", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: employees } = useQuery({
    queryKey: ["business_employees", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase.from("business_employees").select("*").eq("business_id", business.id).eq("status", "active");
      return data || [];
    },
    enabled: !!business,
  });

  const { data: shifts } = useQuery({
    queryKey: ["employee_shifts", business?.id, weekOffset],
    queryFn: async () => {
      if (!business) return [];
      const from = format(weekStart, "yyyy-MM-dd");
      const to = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const { data } = await supabase
        .from("employee_shifts")
        .select("*, business_employees(first_name, last_name)")
        .eq("business_id", business.id)
        .gte("shift_date", from)
        .lte("shift_date", to)
        .order("start_time");
      return data || [];
    },
    enabled: !!business,
  });

  const addShift = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("No business");
      const { error } = await supabase.from("employee_shifts").insert({
        business_id: business.id,
        employee_id: shiftForm.employee_id,
        shift_date: shiftForm.shift_date,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_shifts"] });
      setShowAdd(false);
      toast({ title: "Turno aggiunto" });
    },
    onError: () => toast({ title: "Errore", variant: "destructive" }),
  });

  const getShiftsForDay = (date: Date) => {
    const d = format(date, "yyyy-MM-dd");
    return (shifts || []).filter((s: any) => s.shift_date === d);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/business/team")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Turni Staff</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold">← Prec</button>
          <p className="text-sm font-semibold">
            {format(weekStart, "d MMM", { locale: it })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: it })}
          </p>
          <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold">Succ →</button>
        </div>

        {/* Calendar grid */}
        <div className="space-y-2">
          {weekDays.map(day => {
            const dayShifts = getShiftsForDay(day);
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div key={day.toISOString()} className={`p-3 rounded-xl border ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <p className={`text-xs font-semibold mb-2 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {format(day, "EEEE d", { locale: it })}
                </p>
                {dayShifts.length > 0 ? (
                  <div className="space-y-1">
                    {dayShifts.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <User className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium">{s.business_employees?.first_name} {s.business_employees?.last_name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Nessun turno</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Nuovo Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Dipendente</p>
              <select
                className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                value={shiftForm.employee_id}
                onChange={e => setShiftForm(f => ({ ...f, employee_id: e.target.value }))}
              >
                <option value="">Seleziona...</option>
                {(employees || []).map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </select>
            </div>
            <Input type="date" value={shiftForm.shift_date} onChange={e => setShiftForm(f => ({ ...f, shift_date: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Inizio</p>
                <Input type="time" value={shiftForm.start_time} onChange={e => setShiftForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Fine</p>
                <Input type="time" value={shiftForm.end_time} onChange={e => setShiftForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={!shiftForm.employee_id || !shiftForm.shift_date || addShift.isPending}
              onClick={() => addShift.mutate()}
            >
              Aggiungi Turno
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
