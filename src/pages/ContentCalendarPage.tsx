import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, Sparkles, Instagram, Facebook, Linkedin, Clock, Send, ImageIcon, Video, Hash, Loader2, CheckCircle, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />,
};

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  linkedin: "bg-blue-700",
  tiktok: "bg-black",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-yellow-500/20 text-yellow-400",
  published: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function ContentCalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ platform: "instagram", content_text: "", hashtags: "" });
  const [aiGenerating, setAiGenerating] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["content-calendar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_calendar")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (post: typeof newPost) => {
      const { error } = await supabase.from("content_calendar").insert({
        user_id: user!.id,
        platform: post.platform,
        content_text: post.content_text,
        hashtags: post.hashtags.split(",").map(h => h.trim()).filter(Boolean),
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      setShowCreate(false);
      setNewPost({ platform: "instagram", content_text: "", hashtags: "" });
      toast.success("Post creato!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_calendar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success("Post eliminato");
    },
  });

  const generateAIContent = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-beauty-assistant", {
        body: {
          message: `Genera un post ${newPost.platform} professionale per un salone di bellezza. Includi emoji, hashtag e call-to-action. Rispondi SOLO con il testo del post, niente altro.`,
          context: { role: "content_creator" },
        },
      });
      if (data?.response) {
        const text = data.response;
        const hashtagMatch = text.match(/#\w+/g);
        const mainText = text.replace(/#\w+/g, "").trim();
        setNewPost(prev => ({
          ...prev,
          content_text: mainText,
          hashtags: hashtagMatch ? hashtagMatch.join(", ") : prev.hashtags,
        }));
        toast.success("Contenuto AI generato!");
      }
    } catch {
      toast.error("Errore generazione AI");
    } finally {
      setAiGenerating(false);
    }
  };

  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const draftPosts = posts.filter(p => p.status === "draft");
  const publishedPosts = posts.filter(p => p.status === "published");

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
              <h1 className="text-lg font-bold text-foreground">Content Calendar</h1>
              <p className="text-xs text-muted-foreground">Pianifica i tuoi social con AI</p>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Crea
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Bozze", count: draftPosts.length, color: "text-muted-foreground" },
              { label: "Programmati", count: scheduledPosts.length, color: "text-yellow-400" },
              { label: "Pubblicati", count: publishedPosts.length, color: "text-green-400" },
            ].map(s => (
              <Card key={s.label} className="p-3 text-center bg-card border-border">
                <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Create Modal */}
          {showCreate && (
            <Card className="p-4 bg-card border-primary/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Nuovo Post</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>✕</Button>
              </div>

              <Select value={newPost.platform} onValueChange={v => setNewPost(p => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                  <SelectItem value="facebook">👥 Facebook</SelectItem>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Textarea
                  placeholder="Scrivi il tuo post..."
                  value={newPost.content_text}
                  onChange={e => setNewPost(p => ({ ...p, content_text: e.target.value }))}
                  rows={4}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={generateAIContent}
                  disabled={aiGenerating}
                  aria-label="Genera con AI"
                >
                  {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <input
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder="hashtag1, hashtag2, ..."
                  value={newPost.hashtags}
                  onChange={e => setNewPost(p => ({ ...p, hashtags: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1"
                  onClick={() => createMutation.mutate(newPost)}
                  disabled={!newPost.content_text || createMutation.isPending}
                >
                  <Send className="w-4 h-4" /> Salva Bozza
                </Button>
                <Button variant="outline" className="gap-1" aria-label="Programma">
                  <Clock className="w-4 h-4" /> Programma
                </Button>
              </div>
            </Card>
          )}

          {/* Posts Tabs */}
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Tutti</TabsTrigger>
              <TabsTrigger value="draft" className="flex-1">Bozze</TabsTrigger>
              <TabsTrigger value="scheduled" className="flex-1">Programmati</TabsTrigger>
              <TabsTrigger value="published" className="flex-1">Pubblicati</TabsTrigger>
            </TabsList>

            {["all", "draft", "scheduled", "published"].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-3">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  (tab === "all" ? posts : posts.filter(p => p.status === tab)).map(post => (
                    <Card key={post.id} className="p-3 bg-card border-border">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${platformColors[post.platform] || "bg-primary"}`}>
                          {platformIcons[post.platform] || <Calendar className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground capitalize">{post.platform}</span>
                            <Badge className={`text-[10px] ${statusColors[post.status]}`}>{post.status}</Badge>
                            {post.ai_generated && <Sparkles className="w-3 h-3 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content_text}</p>
                          {post.hashtags && (post.hashtags as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(post.hashtags as string[]).slice(0, 3).map((h, i) => (
                                <span key={i} className="text-[10px] text-primary">#{h}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString("it-IT")}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => deleteMutation.mutate(post.id)}
                          aria-label="Elimina post"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
                {!isLoading && (tab === "all" ? posts : posts.filter(p => p.status === tab)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nessun post {tab !== "all" ? tab : ""}</p>
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
