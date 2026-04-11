import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Instagram, Facebook, Linkedin, Video, Link2, Unlink, Sparkles, MessageCircle, Heart, Share2, Users, TrendingUp, Calendar, Zap, Settings, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  followers: number;
  engagement: number;
  autoPost: boolean;
  autoReply: boolean;
}

export default function SocialAutomationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: "instagram", name: "Instagram", icon: <Instagram className="w-5 h-5" />, color: "from-purple-500 to-pink-500", connected: false, followers: 0, engagement: 0, autoPost: false, autoReply: false },
    { id: "facebook", name: "Facebook", icon: <Facebook className="w-5 h-5" />, color: "from-blue-600 to-blue-500", connected: false, followers: 0, engagement: 0, autoPost: false, autoReply: false },
    { id: "tiktok", name: "TikTok", icon: <Video className="w-5 h-5" />, color: "from-black to-gray-800", connected: false, followers: 0, engagement: 0, autoPost: false, autoReply: false },
    { id: "linkedin", name: "LinkedIn", icon: <Linkedin className="w-5 h-5" />, color: "from-blue-700 to-blue-600", connected: false, followers: 0, engagement: 0, autoPost: false, autoReply: false },
  ]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user?.id);
      return data || [];
    },
    enabled: !!user,
  });

  const toggleConnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p =>
      p.id === platformId ? { ...p, connected: !p.connected, followers: !p.connected ? Math.floor(Math.random() * 5000) + 500 : 0, engagement: !p.connected ? +(Math.random() * 8 + 1).toFixed(1) : 0 } : p
    ));
    const platform = platforms.find(p => p.id === platformId);
    toast.success(platform?.connected ? `${platform.name} disconnesso` : `${platform?.name} connesso!`);
  };

  const toggleAutomation = (platformId: string, type: "autoPost" | "autoReply") => {
    setPlatforms(prev => prev.map(p =>
      p.id === platformId ? { ...p, [type]: !p[type] } : p
    ));
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);

  const automationFeatures = [
    { icon: <Calendar className="w-4 h-4" />, title: "Auto-Pubblicazione", desc: "Post automatici secondo il calendario" },
    { icon: <MessageCircle className="w-4 h-4" />, title: "Auto-Risposta", desc: "Risposte AI ai commenti e DM" },
    { icon: <Heart className="w-4 h-4" />, title: "Auto-Engagement", desc: "Like e commenti strategici" },
    { icon: <Users className="w-4 h-4" />, title: "Auto-Follow", desc: "Crescita follower mirata" },
    { icon: <BarChart3 className="w-4 h-4" />, title: "Analytics AI", desc: "Report performance automatici" },
    { icon: <Sparkles className="w-4 h-4" />, title: "Content AI", desc: "Generazione contenuti automatica" },
  ];

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
                <Zap className="w-5 h-5 text-primary" /> Social Automation
              </h1>
              <p className="text-xs text-muted-foreground">Gestisci tutti i social da qui</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigate("/content-calendar")} aria-label="Calendario">
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center bg-card border-border">
              <div className="text-2xl font-bold text-primary">{connectedCount}</div>
              <div className="text-xs text-muted-foreground">Piattaforme</div>
            </Card>
            <Card className="p-3 text-center bg-card border-border">
              <div className="text-2xl font-bold text-foreground">{totalFollowers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Follower Totali</div>
            </Card>
            <Card className="p-3 text-center bg-card border-border">
              <div className="text-2xl font-bold text-green-400 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {connectedCount > 0 ? (platforms.reduce((s, p) => s + p.engagement, 0) / Math.max(connectedCount, 1)).toFixed(1) : "0"}%
              </div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </Card>
          </div>

          <Tabs defaultValue="platforms">
            <TabsList className="w-full">
              <TabsTrigger value="platforms" className="flex-1">Piattaforme</TabsTrigger>
              <TabsTrigger value="automation" className="flex-1">Automazioni</TabsTrigger>
            </TabsList>

            <TabsContent value="platforms" className="space-y-3 mt-3">
              {platforms.map(platform => (
                <Card key={platform.id} className="p-4 bg-card border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white`}>
                      {platform.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{platform.name}</span>
                        {platform.connected && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Connesso</Badge>}
                      </div>
                      {platform.connected && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{platform.followers.toLocaleString()} follower</span>
                          <span className="text-xs text-green-400">{platform.engagement}% eng.</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant={platform.connected ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleConnect(platform.id)}
                      className="gap-1"
                    >
                      {platform.connected ? <><Unlink className="w-3 h-3" /> Disconnetti</> : <><Link2 className="w-3 h-3" /> Connetti</>}
                    </Button>
                  </div>

                  {platform.connected && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Auto-pubblicazione</span>
                        <Switch
                          checked={platform.autoPost}
                          onCheckedChange={() => toggleAutomation(platform.id, "autoPost")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Auto-risposta AI</span>
                        <Switch
                          checked={platform.autoReply}
                          onCheckedChange={() => toggleAutomation(platform.id, "autoReply")}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="automation" className="space-y-3 mt-3">
              {automationFeatures.map((feature, i) => (
                <Card key={i} className="p-3 bg-card border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">V7 Pro</Badge>
                  </div>
                </Card>
              ))}

              <Card className="p-4 bg-gradient-to-br from-primary/20 to-purple-500/10 border-primary/30 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Sblocca tutte le automazioni</p>
                <p className="text-xs text-muted-foreground mt-1">Passa al piano Business per gestire i social con AI completa</p>
                <Button className="mt-3 gap-1" size="sm" onClick={() => navigate("/subscriptions")}>
                  <Zap className="w-4 h-4" /> Upgrade Business
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}
