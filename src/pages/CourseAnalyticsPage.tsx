import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TrendingUp, Users, Star, Award, ChevronLeft, Loader2, BarChart2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface KpiData {
  revenue: number;
  students: number;
  completionRate: number;
  avgRating: number;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface RatingDist {
  star: number;
  count: number;
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="chrome-card p-4 space-y-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-primary font-medium">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="chrome-card px-3 py-2 text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-primary">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function CourseAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [kpi, setKpi] = useState<KpiData>({ revenue: 0, students: 0, completionRate: 0, avgRating: 0 });
  const [revenueData, setRevenueData] = useState<ChartPoint[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<ChartPoint[]>([]);
  const [ratingDist, setRatingDist] = useState<RatingDist[]>([]);

  useEffect(() => {
    if (id && user) fetchAnalytics();
  }, [id, user, timeRange]);

  const getDateFrom = (): string | null => {
    if (timeRange === "all") return null;
    const days = { "7d": 7, "30d": 30, "90d": 90 }[timeRange];
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    const dateFrom = getDateFrom();

    // Fetch course info
    const { data: courseData } = await supabase
      .from("courses")
      .select("title, price, is_free")
      .eq("id", id!)
      .maybeSingle();
    if (courseData) setCourseTitle((courseData as any).title ?? "");

    // Fetch enrollments
    let enrollQuery = supabase
      .from("enrollments")
      .select("created_at, progress, completed_at, payment_amount")
      .eq("course_id", id!);
    if (dateFrom) enrollQuery = enrollQuery.gte("created_at", dateFrom);
    const { data: enrollments } = await enrollQuery;

    // Fetch reviews
    let reviewQuery = supabase.from("course_reviews").select("rating, created_at").eq("course_id", id!);
    if (dateFrom) reviewQuery = reviewQuery.gte("created_at", dateFrom);
    const { data: reviews } = await reviewQuery;

    // Compute KPIs
    const totalRevenue = (enrollments ?? []).reduce((sum: number, e: any) => sum + (e.payment_amount ?? 0), 0);
    const totalStudents = enrollments?.length ?? 0;
    const completed = (enrollments ?? []).filter((e: any) => e.completed_at || e.progress === 100).length;
    const completionRate = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;
    const avgRating = reviews?.length
      ? parseFloat((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    setKpi({ revenue: totalRevenue, students: totalStudents, completionRate, avgRating });

    // Revenue chart – group by day
    const revMap: Record<string, number> = {};
    (enrollments ?? []).forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
      revMap[day] = (revMap[day] ?? 0) + (e.payment_amount ?? 0);
    });
    setRevenueData(Object.entries(revMap).map(([label, value]) => ({ label, value })));

    // Enrollment chart – group by day
    const enrMap: Record<string, number> = {};
    (enrollments ?? []).forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
      enrMap[day] = (enrMap[day] ?? 0) + 1;
    });
    setEnrollmentData(Object.entries(enrMap).map(([label, value]) => ({ label, value })));

    // Rating distribution
    const rMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (reviews ?? []).forEach((r: any) => { rMap[r.rating] = (rMap[r.rating] ?? 0) + 1; });
    setRatingDist([5, 4, 3, 2, 1].map((star) => ({ star, count: rMap[star] ?? 0 })));

    setLoading(false);
  };

  const ranges: { key: TimeRange; label: string }[] = [
    { key: "7d", label: "7g" },
    { key: "30d", label: "30g" },
    { key: "90d", label: "90g" },
    { key: "all", label: "Tutto" },
  ];

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-30 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm">Analytics Corso</h1>
          {courseTitle && <p className="text-xs text-muted-foreground truncate">{courseTitle}</p>}
        </div>
      </div>

      {/* Time range selector */}
      <div className="px-4 pt-4 pb-2 flex gap-2">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setTimeRange(r.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              timeRange === r.key ? "gradient-primary text-primary-foreground" : "chrome-card text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="px-4 pb-32 space-y-5">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard icon={TrendingUp} label="Guadagni" value={`€${kpi.revenue.toFixed(2)}`} color="bg-green-500" />
            <KpiCard icon={Users} label="Studenti" value={kpi.students.toString()} color="bg-blue-500" />
            <KpiCard icon={Award} label="Completamento" value={`${kpi.completionRate}%`} color="bg-purple-500" />
            <KpiCard
              icon={Star}
              label="Valutazione Media"
              value={kpi.avgRating > 0 ? kpi.avgRating.toString() : "—"}
              color="bg-yellow-500"
            />
          </div>

          {/* Revenue chart */}
          <div className="chrome-card p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Ricavi nel Tempo
            </h3>
            {revenueData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nessun dato disponibile</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="hsl(262 80% 62%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Enrollment chart */}
          <div className="chrome-card p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              Iscrizioni Giornaliere
            </h3>
            {enrollmentData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nessun dato disponibile</p>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="hsl(210 80% 62%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rating distribution */}
          <div className="chrome-card p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Distribuzione Valutazioni
            </h3>
            {ratingDist.every((r) => r.count === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nessuna valutazione ancora</p>
            ) : (
              <div className="space-y-2">
                {ratingDist.map(({ star, count }) => {
                  const total = ratingDist.reduce((s, r) => s + r.count, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6 text-right">{star}★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: "hsl(42 98% 62%)" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
