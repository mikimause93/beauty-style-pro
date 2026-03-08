import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface InstallmentPlan {
  id: string;
  reference_type: string;
  total_amount: number;
  installment_count: number;
  paid_count: number;
  installment_amount: number;
  status: string;
  created_at: string;
}

interface InstallmentPayment {
  id: string;
  plan_id: string;
  amount: number;
  installment_number: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

export default function InstallmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [payments, setPayments] = useState<InstallmentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [{ data: plansData }, { data: paymentsData }] = await Promise.all([
      (supabase as any).from("installment_plans").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("installment_payments").select("*").order("due_date", { ascending: true }),
    ]);
    if (plansData) setPlans(plansData as unknown as InstallmentPlan[]);
    if (paymentsData) setPayments(paymentsData as unknown as InstallmentPayment[]);
    setLoading(false);
  };

  const payInstallment = async (payment: InstallmentPayment) => {
    if (!user) return;
    const { error } = await (supabase as any).from("installment_payments").update({
      status: "paid",
      paid_at: new Date().toISOString(),
    }).eq("id", payment.id);

    if (!error) {
      // Update plan paid count
      const plan = plans.find(p => p.id === payment.plan_id);
      if (plan) {
        const newPaidCount = plan.paid_count + 1;
        await (supabase as any).from("installment_plans").update({
          paid_count: newPaidCount,
          status: newPaidCount >= plan.installment_count ? "completed" : "active",
        }).eq("id", plan.id);
      }
      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "spend",
        amount: payment.amount,
        description: `Rata ${payment.installment_number} pagata`,
        reference_type: "installment",
        reference_id: payment.id,
      });
      toast.success(`Rata ${payment.installment_number} pagata! ✅`);
      loadData();
    }
  };

  const statusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle className="w-4 h-4 text-primary" />;
    if (status === "overdue") return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Rateizzazioni</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nessuna rateizzazione attiva</p>
            <p className="text-xs text-muted-foreground mt-1">Quando acquisti a rate, le troverai qui</p>
          </div>
        ) : (
          plans.map(plan => {
            const planPayments = payments.filter(p => p.plan_id === plan.id);
            const progress = (plan.paid_count / plan.installment_count) * 100;
            return (
              <div key={plan.id} className="rounded-2xl bg-card border border-border p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm capitalize">{plan.reference_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.paid_count}/{plan.installment_count} rate pagate
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    plan.status === "completed" ? "bg-green-500/20 text-green-500" :
                    plan.status === "defaulted" ? "bg-destructive/20 text-destructive" :
                    "bg-primary/20 text-primary"
                  }`}>
                    {plan.status === "completed" ? "Completato" : plan.status === "defaulted" ? "In Ritardo" : "Attivo"}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-muted mb-3">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Totale</span>
                  <span className="font-bold">€{plan.total_amount}</span>
                </div>

                <div className="space-y-2">
                  {planPayments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        {statusIcon(payment.status)}
                        <div>
                          <p className="text-xs font-medium">Rata {payment.installment_number}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Scadenza: {new Date(payment.due_date).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">€{payment.amount}</span>
                        {payment.status === "pending" && (
                          <button
                            onClick={() => payInstallment(payment)}
                            className="px-3 py-1 rounded-lg gradient-primary text-primary-foreground text-[10px] font-bold"
                          >
                            Paga
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
