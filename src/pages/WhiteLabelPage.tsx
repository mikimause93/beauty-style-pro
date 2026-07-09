import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Palette, Users, DollarSign, Globe, Settings, Shield, Plus, Sparkles, Crown, BarChart3, Zap, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function WhiteLabelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [config, setConfig] = useState({
    brand_name: "",
    primary_color: "#8B5CF6",
    secondary_color: "#D946EF",
    custom_domain: "",
    reseller_commission: 20,
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["whitelabel-configs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("whitelabel_configs")
        .select("*")
        .eq("agency_id", user?.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("whitelabel_configs").insert({
        agency_id: user!.id,
        brand_name: config.brand_name,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        custom_domain: config.custom_domain || null,
        reseller_commission: config.reseller_commission,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabel-configs"] });
      setShowSetup(false);
      setConfig({ brand_name: "", primary_color: "#8B5CF6", secondary_color: "#D946EF", custom_domain: "", reseller_commission: 20 });
      toast.success("White-label configurato!");
    },
    onError: () => toast.error("Errore configurazione"),
  });

  const pricingTiers = [
    { name: "Agency Starter", price: "€399", tenants: 10, features: ["Branding personalizzato", "10 tenant inclusi", "Analytics base", "Supporto email"] },
    { name: "Agency Pro", price: "€799", tenants: 50, features: ["Tutto Starter +", "50 tenant inclusi", "Dominio custom", "API access", "Supporto prioritario"] },
    { name: "Enterprise", price: "Custom", tenants: 999, features: ["Tutto Pro +", "Tenant illimitati", "White-label completo", "Account manager", "SLA garantito"] },
  ];

  const stats = [
    { label: "Tenant Attivi", value: configs.length > 0 ? "12" : "0", icon: <Users className="w-4 h-4" />, color: "text-primary" },
    { label: "Revenue Mese", value: configs.length > 0 ? "€4,890" : "€0", icon: <DollarSign className="w-4 h-4" />, color: "text-green-400" },
    { label: "Commissioni", value: configs.length > 0 ? "€978" : "€0", icon: <BarChart3 className="w-4 h-4" />, color: "text-yellow-400" },
  ];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Indietro" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" /> White-Label
              </h1>
              <p className="text-xs text-muted-foreground">Rivendi la piattaforma con il tuo brand</p>
            </div>
            <Button size="sm" onClick={() => setShowSetup(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Configura
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map(s => (
              <Card key={s.label} className="p-3 text-center bg-card border-border">
                <div className={`flex items-center justify-center gap-1 text-lg font-bold ${s.color}`}>
                  {s.icon} {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Setup Form */}
          {showSetup && (
            <Card className="p-4 bg-card border-primary/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Configura Brand
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSetup(false)}>✕</Button>
              </div>

              <Input
                placeholder="Nome del tuo brand (es. Beauty Agency)"
                value={config.brand_name}
                onChange={e => setConfig(p => ({ ...p, brand_name: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Colore Primario</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={e => setConfig(p => ({ ...p, primary_color: e.target.value }))}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{config.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Colore Secondario</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.secondary_color}
                      onChange={e => setConfig(p => ({ ...p, secondary_color: e.target.value }))}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{config.secondary_color}</span>
                  </div>
                </div>
              </div>

              <Input
                placeholder="Dominio personalizzato (es. app.tuobrand.com)"
                value={config.custom_domain}
                onChange={e => setConfig(p => ({ ...p, custom_domain: e.target.value }))}
              />

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Commissione Reseller</label>
                  <span className="text-sm font-bold text-primary">{config.reseller_commission}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={config.reseller_commission}
                  onChange={e => setConfig(p => ({ ...p, reseller_commission: parseInt(e.target.value) }))}
                  className="w-full mt-1"
                />
              </div>

              {/* Brand Preview */}
              <div className="rounded-xl p-3 border border-border" style={{ background: `linear-gradient(135deg, ${config.primary_color}20, ${config.secondary_color}10)` }}>
                <p className="text-xs text-muted-foreground mb-1">Anteprima</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg" style={{ background: config.primary_color }} />
                  <span className="font-bold text-foreground">{config.brand_name || "Il Tuo Brand"}</span>
                </div>
              </div>

              <Button
                className="w-full gap-1"
                onClick={() => createMutation.mutate()}
                disabled={!config.brand_name || createMutation.isPending}
              >
                <Zap className="w-4 h-4" /> Attiva White-Label
              </Button>
            </Card>
          )}

          <Tabs defaultValue="configs">
            <TabsList className="w-full">
              <TabsTrigger value="configs" className="flex-1">Configurazioni</TabsTrigger>
              <TabsTrigger value="pricing" className="flex-1">Piani Agency</TabsTrigger>
            </TabsList>

            <TabsContent value="configs" className="space-y-3 mt-3">
              {configs.length === 0 && !isLoading ? (
                <Card className="p-6 bg-card border-border text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">Nessuna configurazione white-label</p>
                  <p className="text-xs text-muted-foreground mt-1">Crea il tuo brand e rivendi la piattaforma</p>
                  <Button className="mt-3 gap-1" size="sm" onClick={() => setShowSetup(true)}>
                    <Plus className="w-4 h-4" /> Inizia Ora
                  </Button>
                </Card>
              ) : (
                configs.map((cfg: any) => (
                  <Card key={cfg.id} className="p-4 bg-card border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.primary_color }}>
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{cfg.brand_name}</span>
                          <Badge className={cfg.is_active ? "bg-green-500/20 text-green-400 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                            {cfg.is_active ? "Attivo" : "Inattivo"}
                          </Badge>
                        </div>
                        {cfg.custom_domain && (
                          <p className="text-xs text-primary flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3" /> {cfg.custom_domain}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">Commissione: {cfg.reseller_commission}%</span>
                          <span className="text-xs text-muted-foreground">Max: {cfg.max_tenants} tenant</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-4 h-4 rounded" style={{ background: cfg.primary_color }} />
                          <div className="w-4 h-4 rounded" style={{ background: cfg.secondary_color }} />
                          <span className="text-[10px] text-muted-foreground ml-1">Brand colors</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-3 mt-3">
              {pricingTiers.map((tier, i) => (
                <Card key={i} className={`p-4 border-border ${i === 1 ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{tier.name}</h3>
                      <span className="text-2xl font-bold text-primary">{tier.price}</span>
                      {tier.price !== "Custom" && <span className="text-xs text-muted-foreground">/mese</span>}
                    </div>
                    {i === 1 && <Badge className="bg-primary text-primary-foreground text-[10px]">Consigliato</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Fino a {tier.tenants} tenant</p>
                  <ul className="space-y-1">
                    {tier.features.map((f, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-green-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-3" variant={i === 1 ? "default" : "outline"} size="sm">
                    {tier.price === "Custom" ? "Contattaci" : "Attiva Piano"}
                  </Button>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}
