import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Search, Heart, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

const fallbackStylists = [
  { id: "1", business_name: "Martina Rossi", specialty: "Hairstylist", city: "Milano", rating: 4.9, review_count: 127, avatar: stylist2, hourly_rate: 45 },
  { id: "2", business_name: "Sylvie Leaciu Cozeni", specialty: "Colorist", city: "Roma", rating: 4.8, review_count: 89, avatar: stylist1, hourly_rate: 55 },
  { id: "3", business_name: "Marco Barberi", specialty: "Barber", city: "Napoli", rating: 4.7, review_count: 64, avatar: beauty1, hourly_rate: 35 },
];

export default function StylistsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stylists, setStylists] = useState(fallbackStylists);

  useEffect(() => { loadProfessionals(); }, []);

  const loadProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*, profiles:user_id(avatar_url)").order("rating", { ascending: false });
    if (data && data.length > 0) {
      setStylists(data.map((p: any, i: number) => ({
        ...p,
        avatar: (Array.isArray(p.profiles) ? p.profiles[0]?.avatar_url : p.profiles?.avatar_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      })));
    }
  };

  const filtered = stylists.filter(s =>
    s.business_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.specialty || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Stilisti</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca stilisti..."
            className="w-full h-10 rounded-xl bg-card border border-border/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
      </header>

      <div className="px-5 py-4 space-y-2">
        {filtered.map(stylist => (
          <button key={stylist.id} onClick={() => navigate(`/stylist/${stylist.id}`)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-200 text-left">
            <img src={stylist.avatar} alt="" className="w-14 h-14 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{stylist.business_name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stylist.specialty}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Star className="w-3 h-3 text-accent fill-accent" />
                <span className="text-xs font-medium">{stylist.rating}</span>
                <span className="text-[10px] text-muted-foreground">({stylist.review_count})</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {stylist.city}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">€{stylist.hourly_rate}</p>
              <p className="text-[10px] text-muted-foreground">/ora</p>
              <button onClick={e => { e.stopPropagation(); navigate(`/booking/${stylist.id}`); }}
                className="mt-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                Prenota
              </button>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}