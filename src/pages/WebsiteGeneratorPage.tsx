import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe, Sparkles, Palette, Layout, Type, Eye, Rocket, Plus, Settings, ExternalLink, Loader2, Code, Search, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const templates = [
  { id: "modern", name: "Modern", desc: "Pulito e minimalista", color: "from-violet-500 to-purple-600" },
  { id: "elegant", name: "Elegante", desc: "Lusso e raffinatezza", color: "from-amber-500 to-yellow-600" },
  { id: "bold", name: "Bold", desc: "Forte e impattante", color: "from-red-500 to-pink-600" },
  { id: "natural", name: "Naturale", desc: "Organico e rilassante", color: "from-green-500 to-emerald-600" },
];

const pageTypes = [
  { value: "home", label: "🏠 Home Page", icon: <Layout className="w-4 h-4" /> },
  { value: "services", label: "💇 Servizi", icon: <FileText className="w-4 h-4" /> },
  { value: "about", label: "ℹ️ Chi Siamo", icon: <Type className="w-4 h-4" /> },
  { value: "contact", label: "📞 Contatti", icon: <Globe className="w-4 h-4" /> },
  { value: "booking", label: "📅 Prenotazioni", icon: <Rocket className="w-4 h-4" /> },
];

export default function WebsiteGeneratorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newPage, setNewPage] = useState({
    page_type: "home",
    title: "",
    slug: "",
    template: "modern",
    seo_description: "",
  });

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["website-pages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("website_pages")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = newPage.slug || newPage.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("website_pages").insert({
        user_id: user!.id,
        page_type: newPage.page_type,
        title: newPage.title,
        slug,
        template: newPage.template,
        seo_description: newPage.seo_description || null,
        published: false,
        content_html: "",
        styles: { template: newPage.template },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-pages"] });
      setShowCreate(false);
      setNewPage({ page_type: "home", title: "", slug: "", template: "modern", seo_description: "" });
      toast.success("Pagina creata!");
    },
    onError: () => toast.error("Errore creazione pagina"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("website_pages").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-pages"] });
      toast.success("Stato aggiornato!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("website_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-pages"] });
      toast.success("Pagina eliminata");
    },
  });

  const generateWithAI = async () => {
    if (!newPage.title) { toast.error("Inserisci un titolo"); return; }
    setGenerating(true);
    try {
      const { data } = await supabase.functions.invoke("ai-beauty-assistant", {
        body: {
          message: `Genera una meta description SEO (max 160 caratteri) per una pagina "${newPage.page_type}" di un salone di bellezza chiamato "${newPage.title}". Rispondi SOLO con la description.`,
          context: { role: "seo_expert" },
        },
      });
      if (data?.response) {
        setNewPage(p => ({ ...p, seo_description: data.response.slice(0, 160) }));
        toast.success("SEO generato con AI!");
      }
    } catch { toast.error("Errore AI"); }
    finally { setGenerating(false); }
  };

  const publishedPages = pages.filter((p: any) => p.published);
  const draftPages = pages.filter((p: any) => !p.published);

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
                <Globe className="w-5 h-5 text-primary" /> Website Generator
              </h1>
              <p className="text-xs text-muted-foreground">Crea il tuo sito con AI</p>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Nuova
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center bg-card border-border">
              <div className="text-2xl font-bold text-green-400">{publishedPages.length}</div>
              <div className="text-xs text-muted-foreground">Pubblicate</div>
            </Card>
            <Card className="p-3 text-center bg-card border-border">
              <div className="text-2xl font-bold text-muted-foreground">{draftPages.length}</div>
              <div className="text-xs text-muted-foreground">Bozze</div>
            </Card>
          </div>

          {/* Create Form */}
          {showCreate && (
            <Card className="p-4 bg-card border-primary/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Nuova Pagina</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>✕</Button>
              </div>

              <Select value={newPage.page_type} onValueChange={v => setNewPage(p => ({ ...p, page_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pageTypes.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Titolo pagina (es. Beauty Salon Roma)"
                value={newPage.title}
                onChange={e => setNewPage(p => ({ ...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))}
              />

              <Input
                placeholder="URL slug (es. beauty-salon-roma)"
                value={newPage.slug}
                onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))}
                className="text-xs"
              />

              {/* Template Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Template</p>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewPage(p => ({ ...p, template: t.id }))}
                      className={`p-3 rounded-xl border text-left transition-all ${newPage.template === t.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                    >
                      <div className={`w-full h-2 rounded-full bg-gradient-to-r ${t.color} mb-2`} />
                      <p className="text-xs font-medium text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* SEO */}
              <div className="relative">
                <Textarea
                  placeholder="Meta description SEO..."
                  value={newPage.seo_description}
                  onChange={e => setNewPage(p => ({ ...p, seo_description: e.target.value }))}
                  rows={2}
                  className="pr-10 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1"
                  onClick={generateWithAI}
                  disabled={generating}
                  aria-label="Genera SEO con AI"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                </Button>
              </div>

              <Button
                className="w-full gap-1"
                onClick={() => createMutation.mutate()}
                disabled={!newPage.title || createMutation.isPending}
              >
                <Rocket className="w-4 h-4" /> Crea Pagina
              </Button>
            </Card>
          )}

          {/* Pages List */}
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Tutte ({pages.length})</TabsTrigger>
              <TabsTrigger value="published" className="flex-1">Live ({publishedPages.length})</TabsTrigger>
              <TabsTrigger value="draft" className="flex-1">Bozze ({draftPages.length})</TabsTrigger>
            </TabsList>

            {["all", "published", "draft"].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-3">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  (tab === "all" ? pages : tab === "published" ? publishedPages : draftPages).map((page: any) => (
                    <Card key={page.id} className="p-3 bg-card border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          {pageTypes.find(pt => pt.value === page.page_type)?.icon || <FileText className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{page.title}</span>
                            <Badge className={page.published ? "bg-green-500/20 text-green-400 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                              {page.published ? "Live" : "Bozza"}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">/{page.slug}</p>
                          {page.seo_description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 flex items-center gap-1">
                              <Search className="w-3 h-3" /> {page.seo_description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Switch
                              checked={page.published}
                              onCheckedChange={(val) => togglePublish.mutate({ id: page.id, published: val })}
                            />
                            <span className="text-[10px] text-muted-foreground">{page.published ? "Online" : "Offline"}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(page.id)}
                          aria-label="Elimina"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
                {!isLoading && (tab === "all" ? pages : tab === "published" ? publishedPages : draftPages).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nessuna pagina {tab === "draft" ? "in bozza" : tab === "published" ? "pubblicata" : ""}</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}
