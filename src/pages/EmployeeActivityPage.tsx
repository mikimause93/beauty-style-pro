import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Activity, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ACTION_ICONS: Record<string, string> = {
  booking_created: "📅",
  message_sent: "💬",
  product_added: "🛍️",
  shift_started: "🟢",
  shift_ended: "🔴",
  login: "🔑",
};

export default function EmployeeActivityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: business } = useQuery({
    queryKey: ["my_business", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["employee_activity_logs", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase
        .from("employee_activity_logs")
        .select("*, business_employees(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!business,
  });

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/business/team")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Registro Attività</h1>
      </header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (logs || []).length > 0 ? (
          <div className="space-y-2">
            {(logs || []).map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm flex-shrink-0">
                  {ACTION_ICONS[log.action_type] || "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{log.business_employees?.first_name} {log.business_employees?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{log.description || log.action_type}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(log.created_at), "d MMM HH:mm", { locale: it })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nessuna attività registrata</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
