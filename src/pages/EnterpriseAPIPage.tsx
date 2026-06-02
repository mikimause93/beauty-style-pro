import { useState } from "react";
import { ArrowLeft, Key, Copy, Eye, EyeOff, BarChart3, Webhook, Code, RefreshCw, Plus, Trash2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  calls: number;
  active: boolean;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string;
}

const MOCK_KEYS: ApiKey[] = [
  { id: "1", name: "Production Key", key: "sk_live_abc...xyz", created: "2026-03-01", lastUsed: "2026-04-11", calls: 12450, active: true },
  { id: "2", name: "Staging Key", key: "sk_test_def...uvw", created: "2026-02-15", lastUsed: "2026-04-10", calls: 3200, active: true },
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
  { id: "1", url: "https://api.myapp.com/webhooks/booking", events: ["booking.created", "booking.updated"], active: true, lastTriggered: "2 min fa" },
  { id: "2", url: "https://api.myapp.com/webhooks/payment", events: ["payment.completed"], active: true, lastTriggered: "1h fa" },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/v1/bookings", desc: "Lista prenotazioni" },
  { method: "POST", path: "/v1/bookings", desc: "Crea prenotazione" },
  { method: "GET", path: "/v1/clients", desc: "Lista clienti" },
  { method: "GET", path: "/v1/services", desc: "Lista servizi" },
  { method: "GET", path: "/v1/analytics", desc: "Dati analytics" },
  { method: "POST", path: "/v1/notifications", desc: "Invia notifica" },
  { method: "GET", path: "/v1/products", desc: "Lista prodotti" },
  { method: "POST", path: "/v1/ai/predict", desc: "Previsioni AI" },
];

const WEBHOOK_EVENTS = [
  "booking.created", "booking.updated", "booking.cancelled",
  "payment.completed", "payment.failed",
  "client.created", "client.updated",
  "review.created", "product.sold",
];

export default function EnterpriseAPIPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState(MOCK_KEYS);
  const [webhooks] = useState(MOCK_WEBHOOKS);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  const usage = { current: 12450, limit: 50000, percentage: 24.9 };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copiata!");
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Inserisci un nome per la chiave");
      return;
    }
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `sk_live_${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Mai",
      calls: 0,
      active: true,
    };
    setKeys(prev => [...prev, newKey]);
    setNewKeyName("");
    toast.success("Nuova API Key generata!");
  };

  const handleDeleteKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success("API Key eliminata");
  };

  const methodColor = (m: string) => {
    switch (m) {
      case "GET": return "bg-green-500/10 text-green-600";
      case "POST": return "bg-blue-500/10 text-blue-600";
      case "PUT": return "bg-yellow-500/10 text-yellow-600";
      case "DELETE": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 flex items-center gap-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Torna indietro">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Code className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">Enterprise API</h1>
        <Badge className="ml-auto text-[10px]">v1</Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Usage */}
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Utilizzo API</span>
              <span className="text-xs text-muted-foreground">
                {usage.current.toLocaleString()} / {usage.limit.toLocaleString()} calls
              </span>
            </div>
            <Progress value={usage.percentage} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1">Reset: 1 maggio 2026</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="keys">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="keys" className="text-xs"><Key className="w-3 h-3 mr-1" />Chiavi</TabsTrigger>
            <TabsTrigger value="endpoints" className="text-xs"><Code className="w-3 h-3 mr-1" />Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs"><Webhook className="w-3 h-3 mr-1" />Webhooks</TabsTrigger>
          </TabsList>

          {/* API KEYS */}
          <TabsContent value="keys" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Genera Nuova Chiave</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  placeholder="Nome chiave..."
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleGenerateKey}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {keys.map(k => (
              <Card key={k.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{k.name}</span>
                    </div>
                    <Switch checked={k.active} onCheckedChange={() => {
                      setKeys(prev => prev.map(key => key.id === k.id ? { ...key, active: !key.active } : key));
                    }} />
                  </div>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                    <code className="text-xs flex-1 font-mono">
                      {showKey === k.id ? k.key : "sk_live_•••••••••••"}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKey(showKey === k.id ? null : k.id)} aria-label="Mostra chiave">
                      {showKey === k.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyKey(k.key)} aria-label="Copia chiave">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteKey(k.id)} aria-label="Elimina chiave">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Creata: {k.created}</span>
                    <span>Ultimo uso: {k.lastUsed}</span>
                    <span>{k.calls.toLocaleString()} calls</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ENDPOINTS */}
          <TabsContent value="endpoints" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Endpoints Disponibili</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {API_ENDPOINTS.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                    <Badge className={`${methodColor(ep.method)} text-[10px] font-mono px-2`} variant="secondary">
                      {ep.method}
                    </Badge>
                    <code className="text-xs font-mono flex-1">{ep.path}</code>
                    <span className="text-[10px] text-muted-foreground">{ep.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Esempio Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-3">
                  <code className="text-[10px] font-mono whitespace-pre-wrap text-foreground">
{`curl -X GET \\
  https://api.stayle.com/v1/bookings \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json"`}
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rate Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { plan: "Starter", limit: "1,000/giorno", burst: "10/sec" },
                  { plan: "Business", limit: "10,000/giorno", burst: "50/sec" },
                  { plan: "Enterprise", limit: "100,000/giorno", burst: "200/sec" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1">
                    <Badge variant="outline" className="text-[10px]">{r.plan}</Badge>
                    <span>{r.limit}</span>
                    <span className="text-muted-foreground">{r.burst}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEBHOOKS */}
          <TabsContent value="webhooks" className="space-y-4 mt-4">
            {webhooks.map(w => (
              <Card key={w.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono truncate max-w-[200px]">{w.url}</code>
                    </div>
                    <Switch checked={w.active} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {w.events.map(e => (
                      <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Ultimo trigger: {w.lastTriggered}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Eventi Disponibili</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {WEBHOOK_EVENTS.map(e => (
                    <Badge key={e} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10">
                      {e}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Webhook
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
