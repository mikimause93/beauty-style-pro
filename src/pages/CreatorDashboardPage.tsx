import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TrendingUp, Users, BookOpen, Crown, Plus, BarChart2, Edit,
  Zap, Play, Wallet, ChevronRight, Star, AlertCircle, Loader2, Award
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  total_earnings: number | null;
  subscribers_count: number | null;
  courses_count: number | null;
  tier: string | null;
}

interface CourseItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  is_published: boolean;
  price: number | null;
  is_free: boolean | null;
  enrolled_count: number | null;
  rating: number | null;
}

interface Earning {
  net_amount: number;
  created_at: string;
  source_type: string | null;
}

interface ChartPoint {
  label: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="chrome-card px-3 py-2 text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-primary">€{payload[0].value?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function CreatorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [becomingCreator, setBecomingCreator] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch creator profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    setCreatorProfile(profile as CreatorProfile | null);

    if (profile) {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, is_published, price, is_free, enrolled_count, rating")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      setCourses((coursesData as CourseItem[]) ?? []);

      // Fetch earnings
      const { data: earningsData } = await supabase
        .from("creator_earnings")
        .select("net_amount, created_at, source_type")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      const earnList = (earningsData as Earning[]) ?? [];
      setEarnings(earnList);

      // Compute available balance (not yet paid out)
      const { data: payouts } = await supabase
        .from("creator_payouts")
        .select("amount")
        .eq("creator_id", user!.id);
      const totalEarned = earnList.reduce((s, e) => s + (e.net_amount ?? 0), 0);
      const totalPaid = ((payouts as any[]) ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
      setAvailableBalance(Math.max(0, totalEarned - totalPaid));

      // Build revenue chart (last 30 days)
      const map: Record<string, number> = {};
      earnList.slice(0, 30).forEach((e) => {
        const day = new Date(e.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
        map[day] = (map[day] ?? 0) + (e.net_amount ?? 0);
      });
      setRevenueChart(Object.entries(map).reverse().map(([label, value]) => ({ label, value })));
    }

    setLoading(false);
  };

  const handleBecomeCreator = async () => {
    if (!user) return;
    setBecomingCreator(true);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("creator_profiles").insert({
      user_id: user.id,
      display_name: (profileData as any)?.display_name ?? user.email?.split("@")[0] ?? "Creator",
      tier: "free",
    });

    if (error) {
      toast.error("Errore durante la registrazione");
    } else {
      toast.success("Profilo creator creato! Benvenuto! 🎉");
      await fetchData();
    }
    setBecomingCreator(false);
  };

  const handleRequestPayout = async () => {
    if (availableBalance < 10) { toast.error("Saldo minimo €10 per richiedere pagamento"); return; }
    setRequestingPayout(true);
    const { error } = await supabase.from("creator_payouts").insert({
      creator_id: user!.id,
      amount: availableBalance,
      status: "pending",
    });
    if (error) toast.error("Errore richiesta pagamento");
    else { toast.success(`Pagamento di €${availableBalance.toFixed(2)} richiesto!`); await fetchData(); }
    setRequestingPayout(false);
  };

  const totalEarnings = earnings.reduce((s, e) => s + (e.net_amount ?? 0), 0);

  // Group earnings by source
  const earningsBySource = earnings.reduce<Record<string, number>>((acc, e) => {
    const src = e.source_type ?? "altro";
    acc[src] = (acc[src] ?? 0) + (e.net_amount ?? 0);
    return acc;
  }, {});

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  // Not a creator yet
  if (!creatorProfile) {
    return (
      <MobileLayout>
        <div className="px-4 pt-12 pb-32 flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Diventa Creator</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Crea corsi, gestisci il tuo studio e monetizza le tue competenze beauty con Beauty Style Pro Academy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {[
              { icon: BookOpen, text: "Crea corsi illimitati" },
              { icon: Wallet, text: "Guadagna dal tuo know-how" },
              { icon: Users, text: "Raggiungi migliaia di studenti" },
              { icon: Award, text: "Certificati ufficiali" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="chrome-card p-3 flex flex-col items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <p className="text-xs text-center text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleBecomeCreator}
            disabled={becomingCreator}
            className="w-full max-w-xs py-4 rounded-2xl gradient-primary text-primary-foreground font-bold text-lg shadow-glow disabled:opacity-60"
          >
            {becomingCreator ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Diventa Creator"}
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="relative gradient-primary px-4 pt-10 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/70 text-sm">Creator Studio</p>
            <h1 className="text-2xl font-bold text-primary-foreground">{creatorProfile.display_name}</h1>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
            creatorProfile.tier === "pro" ? "bg-yellow-400/20 text-yellow-400" : "bg-white/20 text-white"
          }`}>
            {creatorProfile.tier === "pro" ? "PRO ✨" : "FREE"}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Corsi", value: courses.length },
            { label: "Studenti", value: creatorProfile.subscribers_count ?? 0 },
            { label: "Valutazione", value: "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-primary-foreground">{value}</p>
              <p className="text-xs text-primary-foreground/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 -mt-8 mb-4">
        <div className="chrome-card p-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/formation/create-course")}
            className="py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 shadow-glow"
          >
            <Plus className="w-4 h-4" />
            Nuovo Corso
          </button>
          <button
            onClick={() => navigate("/go-live")}
            className="py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Vai Live
          </button>
        </div>
      </div>

      <div className="px-4 pb-32 space-y-5">
        {/* Revenue overview */}
        <div className="chrome-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Ricavi Totali
            </h3>
            <span className="text-xl font-bold text-green-400">€{totalEarnings.toFixed(2)}</span>
          </div>

          {Object.entries(earningsBySource).length > 0 && (
            <div className="space-y-2">
              {Object.entries(earningsBySource).map(([source, amount]) => (
                <div key={source} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{source}</span>
                  <span className="font-medium">€{(amount as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(0 0% 60%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 60%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="hsl(142 70% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Nessun ricavo ancora</p>
          )}
        </div>

        {/* Payout section */}
        <div className="chrome-card p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Pagamenti
          </h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Saldo Disponibile</p>
              <p className="text-lg font-bold text-primary">€{availableBalance.toFixed(2)}</p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={requestingPayout || availableBalance < 10}
              className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {requestingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Richiedi Pagamento"}
            </button>
          </div>
          {availableBalance < 10 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Minimo €10 per richiedere un pagamento
            </p>
          )}
        </div>

        {/* My Courses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              I Miei Corsi
            </h3>
            <button onClick={() => navigate("/formation/create-course")} className="text-xs text-primary font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Nuovo
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground chrome-card p-6">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nessun corso ancora</p>
              <p className="text-xs mb-4">Crea il tuo primo corso e inizia a guadagnare</p>
              <button onClick={() => navigate("/formation/create-course")} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
                Crea Corso
              </button>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="chrome-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-foreground/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h4 className="font-semibold text-sm truncate flex-1">{course.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        course.is_published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                      }`}>
                        {course.is_published ? "Live" : "Bozza"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.enrolled_count ?? 0}
                      </span>
                      {course.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {course.rating}
                        </span>
                      )}
                      <span>{course.is_free ? "Gratuito" : `€${course.price}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/formation/edit-course/${course.id}`)}
                    className="flex-1 py-2 rounded-lg chrome-card text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifica
                  </button>
                  <button
                    onClick={() => navigate(`/formation/analytics/${course.id}`)}
                    className="flex-1 py-2 rounded-lg chrome-card text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Analytics
                  </button>
                  <button
                    onClick={() => navigate(`/formation/course/${course.id}`)}
                    className="py-2 px-3 rounded-lg chrome-card text-xs font-medium flex items-center justify-center"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upgrade CTA for free tier */}
        {creatorProfile.tier !== "pro" && (
          <div className="chrome-card p-5 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Passa a Creator Pro</h3>
                <p className="text-xs text-muted-foreground">Sblocca funzionalità avanzate</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {[
                "Commissioni ridotte al 10%",
                "Corsi illimitati",
                "Analytics avanzate",
                "Brand partnerships",
                "Supporto prioritario",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/subscriptions")}
              className="w-full py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-semibold"
            >
              Scopri Creator Pro →
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
