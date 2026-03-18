import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Heart, Search, Sparkles, Scissors, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

interface StyleCard {
  id: string;
  name: string;
  image: string;
  artistName: string;
  artistAvatar: string;
  rating: number;
  reviewCount: number;
  price: number;
  tags: string[];
  category: string;
  professionalId?: string;
}

const STYLE_TAGS = [
  { label: "Tutti", value: "" },
  { label: "#French", value: "French" },
  { label: "#Y2K", value: "Y2K" },
  { label: "#Ombre", value: "Ombre" },
  { label: "#Floral", value: "Floral" },
  { label: "#Marble", value: "Marble" },
  { label: "#Balayage", value: "Balayage" },
  { label: "#Microblading", value: "Microblading" },
  { label: "#Extension", value: "Extension" },
  { label: "#Smokey", value: "Smokey" },
  { label: "#Natural", value: "Natural" },
];

const CATEGORIES = ["Tutti", "Nail Art", "Capelli", "Sopracciglia", "Makeup"];

const FALLBACK_STYLES: StyleCard[] = [
  {
    id: "s1",
    name: "French Classic Tips",
    image: beauty1,
    artistName: "Martina Rossi",
    artistAvatar: stylist2,
    rating: 4.9,
    reviewCount: 127,
    price: 35,
    tags: ["French", "Nail Art", "Classic"],
    category: "Nail Art",
  },
  {
    id: "s2",
    name: "Y2K Chrome Nails",
    image: beauty2,
    artistName: "Sylvie Leaciu",
    artistAvatar: stylist1,
    rating: 4.8,
    reviewCount: 89,
    price: 45,
    tags: ["Y2K", "Nail Art", "Chrome"],
    category: "Nail Art",
  },
  {
    id: "s3",
    name: "Balayage Sunkissed",
    image: stylist1,
    artistName: "Marco Barberi",
    artistAvatar: beauty1,
    rating: 4.9,
    reviewCount: 204,
    price: 120,
    tags: ["Balayage", "Capelli", "Color"],
    category: "Capelli",
  },
  {
    id: "s4",
    name: "Floral Nail Design",
    image: beauty3,
    artistName: "Giulia Ferrari",
    artistAvatar: stylist2,
    rating: 4.7,
    reviewCount: 63,
    price: 40,
    tags: ["Floral", "Nail Art", "Art"],
    category: "Nail Art",
  },
  {
    id: "s5",
    name: "Microblading Brows",
    image: stylist2,
    artistName: "Elena Conti",
    artistAvatar: beauty2,
    rating: 5.0,
    reviewCount: 152,
    price: 180,
    tags: ["Microblading", "Sopracciglia"],
    category: "Sopracciglia",
  },
  {
    id: "s6",
    name: "Ombre Nail Art",
    image: beauty1,
    artistName: "Sara Bianchi",
    artistAvatar: stylist1,
    rating: 4.8,
    reviewCount: 77,
    price: 38,
    tags: ["Ombre", "Nail Art", "Gradient"],
    category: "Nail Art",
  },
  {
    id: "s7",
    name: "Marble Nails",
    image: beauty2,
    artistName: "Chiara Russo",
    artistAvatar: beauty3,
    rating: 4.6,
    reviewCount: 45,
    price: 42,
    tags: ["Marble", "Nail Art", "Luxury"],
    category: "Nail Art",
  },
  {
    id: "s8",
    name: "Smokey Eye Glam",
    image: beauty3,
    artistName: "Valentina Mori",
    artistAvatar: stylist2,
    rating: 4.9,
    reviewCount: 188,
    price: 65,
    tags: ["Smokey", "Makeup", "Glam"],
    category: "Makeup",
  },
  {
    id: "s9",
    name: "Extension Volume",
    image: stylist1,
    artistName: "Francesca Costa",
    artistAvatar: beauty1,
    rating: 4.7,
    reviewCount: 93,
    price: 95,
    tags: ["Extension", "Capelli", "Volume"],
    category: "Capelli",
  },
  {
    id: "s10",
    name: "Natural Brow Lamination",
    image: beauty2,
    artistName: "Alessia Greco",
    artistAvatar: stylist1,
    rating: 4.8,
    reviewCount: 110,
    price: 55,
    tags: ["Natural", "Sopracciglia", "Laminazione"],
    category: "Sopracciglia",
  },
];

export default function StylesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tutti");
  const [searchQuery, setSearchQuery] = useState("");
  const [styles, setStyles] = useState<StyleCard[]>(FALLBACK_STYLES);
  const [savedStyles, setSavedStyles] = useState<string[]>([]);

  useEffect(() => {
    loadStylesFromDB();
  }, []);

  const loadStylesFromDB = async () => {
    try {
      const { data: services } = await supabase
        .from("services")
        .select("*, professionals(business_name, city, rating, user_id, profiles:user_id(avatar_url))")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (services && services.length > 0) {
        const mapped: StyleCard[] = services.map((svc, i) => {
          const pro = Array.isArray(svc.professionals) ? svc.professionals[0] : svc.professionals;
          const profileAvatar = pro?.profiles
            ? (Array.isArray(pro.profiles) ? pro.profiles[0]?.avatar_url : pro.profiles?.avatar_url)
            : null;
          const fallbackImg = [beauty1, beauty2, beauty3, stylist1, stylist2][i % 5];
          return {
            id: svc.id,
            name: svc.name,
            image: fallbackImg,
            artistName: pro?.business_name || "Artista Beauty",
            artistAvatar: profileAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${svc.id}`,
            rating: typeof pro?.rating === "number" ? pro.rating : 4.8,
            reviewCount: Math.floor((svc.id.charCodeAt(0) + svc.id.charCodeAt(svc.id.length - 1)) % 150 + 30),
            price: svc.price,
            tags: svc.category ? [svc.category] : ["Beauty"],
            category: svc.category || "Servizi",
            professionalId: svc.professional_id,
          };
        });
        setStyles(mapped);
      }
    } catch {
      // keep fallback
    }
  };

  const toggleSave = (id: string) => {
    if (!user) {
      toast.info("Accedi per salvare gli stili");
      navigate("/auth");
      return;
    }
    setSavedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    toast.success(savedStyles.includes(id) ? "Rimosso dai salvati" : "Stile salvato!");
  };

  const handleBook = (style: StyleCard) => {
    if (!user) {
      toast.info("Accedi per prenotare");
      navigate("/auth");
      return;
    }
    if (style.professionalId) {
      navigate(`/booking/${style.professionalId}`);
    } else {
      navigate("/booking");
    }
  };

  const handleRequest = (style: StyleCard) => {
    if (!user) {
      toast.info("Accedi per inviare una richiesta");
      navigate("/auth");
      return;
    }
    navigate("/marketplace/create-request", { state: { styleName: style.name } });
  };

  const filtered = styles.filter(s => {
    const matchTag = !activeTag || s.tags.some(t => t.toLowerCase().includes(activeTag.toLowerCase()));
    const matchCat = activeCategory === "Tutti" || s.category === activeCategory;
    const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.artistName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTag && matchCat && matchSearch;
  });

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 pt-3 pb-2 space-y-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold leading-tight">Style Gallery</h1>
            <p className="text-[11px] text-muted-foreground">Scopri i look di tendenza</p>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca stili, artisti..."
            className="w-full h-10 rounded-full bg-muted pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hashtag filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {STYLE_TAGS.map(tag => (
            <button
              key={tag.value}
              type="button"
              onClick={() => setActiveTag(tag.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTag === tag.value
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/30"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Scissors className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nessuno stile trovato</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">{filtered.length} stili disponibili</p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(style => (
                <div key={style.id} className="rounded-2xl bg-card border border-border/50 overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Save button */}
                    <button
                      type="button"
                      onClick={() => toggleSave(style.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center transition-all"
                      aria-label="Salva stile"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          savedStyles.includes(style.id) ? "text-red-500 fill-red-500" : "text-white"
                        }`}
                      />
                    </button>
                    {/* Tags */}
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      {style.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-semibold backdrop-blur-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-semibold leading-tight line-clamp-1">{style.name}</p>

                    {/* Artist */}
                    <div className="flex items-center gap-1.5">
                      <img
                        src={style.artistAvatar}
                        alt={style.artistName}
                        className="w-5 h-5 rounded-full object-cover border border-primary/20"
                      />
                      <span className="text-[10px] text-muted-foreground truncate">{style.artistName}</span>
                    </div>

                    {/* Rating & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span className="text-xs font-semibold">{style.rating.toFixed(1)}</span>
                        <span className="text-[9px] text-muted-foreground">({style.reviewCount})</span>
                      </div>
                      <span className="text-sm font-bold text-primary">€{style.price}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-auto">
                      <button
                        type="button"
                        onClick={() => handleBook(style)}
                        className="flex-1 py-1.5 rounded-xl gradient-primary text-primary-foreground text-[10px] font-bold shadow-glow transition-all active:scale-95"
                      >
                        Prenota
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequest(style)}
                        className="flex-1 py-1.5 rounded-xl bg-muted text-foreground text-[10px] font-semibold transition-all active:scale-95"
                      >
                        Richiedi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* View All Professionals */}
        <button
          type="button"
          onClick={() => navigate("/stylists")}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-sm font-semibold hover:border-primary/30 transition-all"
        >
          <Scissors className="w-4 h-4 text-primary" />
          Scopri tutti i professionisti
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </MobileLayout>
  );
}
