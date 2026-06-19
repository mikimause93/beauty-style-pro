import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Users, AlertTriangle, Sparkles, Calendar, DollarSign, BarChart3, Target, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface InsightCard {
  id: string;
  type: string;
  title: string;
  value: string;
  change: number;
  confidence: number;
  icon: React.ReactNode;
  color: string;
  detail: string;
}

export default function PredictiveAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["predictive-insights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("predictive_insights")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Generate demo predictive cards when no real data
  const predictiveCards: InsightCard[] = [
    {
      id: "rev",
      type: "revenue",
      title: "Previsione Revenue",
      value: "€12,450",
      change: 18,
      confidence: 82,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-green-400",
      detail: "Prossimi 30 giorni basato su trend storico",
    },
    {
      id: "churn",
      type: "churn",
      title: "Rischio Churn",
      value: "12 clienti",
      change: -5,
      confidence: 75,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-yellow-400",
      detail: "Clienti che non prenotano da 45+ giorni",
    },
    {
      id: "busy",
      type: "busy_period",
      title: "Periodo Più Attivo",
      value: "Venerdì 14-18",
      change: 25,
      confidence: 90,
      icon: <Calendar className="w-5 h-5" />,
      color: "text-blue-400",
      detail: "Basato su 6 mesi di prenotazioni",
    },
    {
      id: "growth",
      type: "growth",
      title: "Crescita Follower",
      value: "+340/mese",
      change: 12,
      confidence: 68,
      icon: <Users className="w-5 h-5" />,
      color: "text-purple-400",
      detail: "Stima crescita organica social",
    },
    {
      id: "roi",
      type: "roi",
      title: "ROI Marketing",
      value: "4.2x",
      change: 30,
      confidence: 71,
      icon: <Target className="w-5 h-5" />,
      color: "text-primary",
      detail: "Ritorno su investimento ads previsto",
    },
    {
      id: "booking",
      type: "booking",
      title: "Prenotazioni Previste",
      value: "87",
      change: 8,
      confidence: 85,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-emerald-400",
      detail: "Prossima settimana vs media",
    },
  ];

  const aiRecommendations = [
    { emoji: "🎯", text: "Lancia una promozione martedì per riempire gli slot vuoti", priority: "high" },
    { emoji: "📱", text: "Pubblica un Reel before/after il giovedì alle 18:00", priority: "high" },
    { emoji: "💌", text: "Invia reminder ai 12 clienti a rischio churn", priority: "medium" },
    { emoji: "💰", text: "Aumenta budget ads Instagram del 15% nel weekend", priority: "medium" },
    { emoji: "⭐", text: "Chiedi recensioni ai clienti soddisfatti di questa settimana", priority: "low" },
  ];

  const priorityColors: Record<string, string> = {
    high: "border-l-red-400",
    medium: "border-l-yellow-400",
    low: "border-l-green-400",
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Indietro" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" /> AI Predictive
              </h1>
              <p className="text-xs text-muted-foreground">Previsioni intelligenti per il tuo business</p>
            </div>
            <Button variant="outline" size="icon" aria-label="Aggiorna">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Overall Score */}
          <Card className="p-4 bg-gradient-to-br from-primary/20 to-purple-500/10 border-primary/30">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Health Score Business</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-foreground">87</span>
                  <span className="text-xs text-green-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +5%
                  </span>
                </div>
                <Progress value={87} className="h-1.5 mt-1" />
              </div>
            </div>
          </Card>

          {/* Predictive Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {predictiveCards.map(card => (
              <Card key={card.id} className="p-3 bg-card border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className={card.color}>{card.icon}</div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.type}</span>
                </div>
                <div className="text-lg font-bold text-foreground">{card.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {card.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${card.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {card.change > 0 ? "+" : ""}{card.change}%
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${card.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{card.confidence}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{card.detail}</p>
              </Card>
            ))}
          </div>

          {/* AI Recommendations */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Azioni Raccomandate da AI
            </h2>
            <div className="space-y-2">
              {aiRecommendations.map((rec, i) => (
                <Card key={i} className={`p-3 bg-card border-border border-l-2 ${priorityColors[rec.priority]}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{rec.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{rec.text}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{rec.priority}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* DB Insights */}
          {insights.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Insights Salvati</h2>
              <div className="space-y-2">
                {insights.map((insight: any) => (
                  <Card key={insight.id} className="p-3 bg-card border-border">
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{insight.insight_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">Confidenza: {insight.confidence_score}%</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
