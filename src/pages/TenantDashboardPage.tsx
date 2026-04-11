import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Palette, Users, Settings, Plus, Crown, Globe, Zap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const TenantDashboardPage = () => {
  const { user } = useAuth();
  const { currentTenant, myTenants, createTenant, updateTenant, setCurrentTenant, isLoading } = useTenant();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Load members for current tenant
  const { data: members = [] } = useQuery({
    queryKey: ["tenant-members", currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return [];
      const { data } = await supabase
        .from("tenant_members")
        .select("*")
        .eq("tenant_id", currentTenant.id);
      return data || [];
    },
    enabled: !!currentTenant,
  });

  const handleCreate = async () => {
    if (!newName || !newSlug) {
      toast.error("Nome e slug sono obbligatori");
      return;
    }
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const tenant = await createTenant({ name: newName, slug, description: newDesc });
    if (tenant) {
      toast.success("Tenant creato con successo!");
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      setNewDesc("");
    } else {
      toast.error("Errore nella creazione del tenant");
    }
  };

  const planColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/20 text-primary",
    business: "bg-accent/20 text-accent-foreground",
    enterprise: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Tenant Dashboard</h1>
          </div>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-1" /> Nuovo
          </Button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="text-sm">Crea Nuovo Tenant</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nome Business" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }} />
              <Input placeholder="slug-url" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="font-mono text-sm" />
              <Textarea placeholder="Descrizione (opzionale)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1">Crea Tenant</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annulla</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tenant Selector */}
        {myTenants.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {myTenants.map(t => (
              <button
                key={t.id}
                onClick={() => setCurrentTenant(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  currentTenant?.id === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Current Tenant Dashboard */}
        {currentTenant ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="overview" className="text-xs"><BarChart3 className="w-3.5 h-3.5" /></TabsTrigger>
              <TabsTrigger value="brand" className="text-xs"><Palette className="w-3.5 h-3.5" /></TabsTrigger>
              <TabsTrigger value="team" className="text-xs"><Users className="w-3.5 h-3.5" /></TabsTrigger>
              <TabsTrigger value="settings" className="text-xs"><Settings className="w-3.5 h-3.5" /></TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-3">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{currentTenant.name}</h2>
                      <p className="text-xs text-muted-foreground">/{currentTenant.slug}</p>
                    </div>
                    <Badge className={planColors[currentTenant.plan] || planColors.free}>
                      <Crown className="w-3 h-3 mr-1" />
                      {currentTenant.plan.toUpperCase()}
                    </Badge>
                  </div>
                  {currentTenant.description && (
                    <p className="text-sm text-muted-foreground">{currentTenant.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Users className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-2xl font-bold text-foreground">{members.length + 1}</p>
                    <p className="text-xs text-muted-foreground">Membri</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Zap className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-2xl font-bold text-foreground">{currentTenant.features_enabled.length}</p>
                    <p className="text-xs text-muted-foreground">Moduli Attivi</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Globe className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-2xl font-bold text-foreground">{currentTenant.country}</p>
                    <p className="text-xs text-muted-foreground">Paese</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Building2 className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-2xl font-bold text-foreground">{currentTenant.currency}</p>
                    <p className="text-xs text-muted-foreground">Valuta</p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Features */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Moduli Attivi</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {currentTenant.features_enabled.map(f => (
                    <Badge key={f} variant="secondary" className="text-xs capitalize">{f}</Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brand Tab */}
            <TabsContent value="brand" className="space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Personalizzazione Brand</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Logo URL</label>
                    <Input
                      placeholder="https://..."
                      defaultValue={currentTenant.logo_url || ""}
                      onBlur={e => updateTenant(currentTenant.id, { logo_url: e.target.value } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Colori Brand</label>
                    <div className="flex gap-3">
                      {Object.entries(currentTenant.brand_colors || {}).map(([key, val]) => (
                        <div key={key} className="flex-1 text-center">
                          <div className="w-10 h-10 rounded-full mx-auto border-2 border-border" style={{ backgroundColor: val as string }} />
                          <p className="text-[10px] text-muted-foreground mt-1 capitalize">{key}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Dominio Personalizzato</label>
                    <Input
                      placeholder="tuobrand.com"
                      defaultValue={currentTenant.custom_domain || ""}
                      onBlur={e => updateTenant(currentTenant.id, { custom_domain: e.target.value } as any)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Team ({members.length + 1}/{currentTenant.max_members})</CardTitle>
                    <Button size="sm" variant="outline">
                      <Plus className="w-3 h-3 mr-1" /> Invita
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Tu (Owner)</p>
                        <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary text-[10px]">Owner</Badge>
                  </div>
                  {/* Members */}
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.user_id.slice(0, 8)}...</p>
                          <p className="text-[10px] text-muted-foreground">{m.role}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">{m.role}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-sm">Impostazioni Tenant</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nome Business</label>
                    <Input
                      defaultValue={currentTenant.name}
                      onBlur={e => updateTenant(currentTenant.id, { name: e.target.value } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Lingua</label>
                    <Input
                      defaultValue={currentTenant.language}
                      onBlur={e => updateTenant(currentTenant.id, { language: e.target.value } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Valuta</label>
                    <Input
                      defaultValue={currentTenant.currency}
                      onBlur={e => updateTenant(currentTenant.id, { currency: e.target.value } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Paese</label>
                    <Input
                      defaultValue={currentTenant.country}
                      onBlur={e => updateTenant(currentTenant.id, { country: e.target.value } as any)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="pt-8 pb-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">Nessun Tenant</h3>
              <p className="text-sm text-muted-foreground mb-4">Crea il tuo primo tenant per iniziare con la piattaforma multi-tenant</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" /> Crea il tuo Tenant
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};

export default TenantDashboardPage;
