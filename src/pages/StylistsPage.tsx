import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Search, Heart, MapPin, Star, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import beauty1 from "@/assets/beauty-1.jpg";

const fallbackStylists = [
  {
    id: "1",
    business_name: "Martina Rossi",
    specialty: "Hairstylist",
    city: "Milano",
    rating: 4.9,
    review_count: 127,
    avatar: stylist2,
    hourly_rate: 45,
  },
  {
    id: "2",
    business_name: "Sylvie Leaciu Cozeni",
    specialty: "Colorist",
    city: "Roma",
    rating: 4.8,
    review_count: 89,
    avatar: stylist1,
    hourly_rate: 55,
  },
  {
    id: "3",
    business_name: "Marco Barberi",
    specialty: "Barber",
    city: "Napoli",
    rating: 4.7,
    review_count: 64,
    avatar: beauty1,
    hourly_rate: 35,
  },
];

export default function StylistsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stylists, setStylists] = useState(fallbackStylists);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*");
    if (data && data.length > 0) {
      setStylists(data.map((p, i) => ({
        ...p,
        avatar: fallbackStylists[i % fallbackStylists.length].avatar,
      })));
    }
  };

  const filtered = stylists.filter(s =>
    s.business_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.specialty || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Stylists</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca stilisti..."
            className="w-full h-10 rounded-xl bg-card border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </header>

      <div className="p-4 space-y-3">
        {filtered.map(stylist => (
          <button
            key={stylist.id}
            onClick={() => navigate(`/stylist/${stylist.id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card shadow-card hover:bg-muted transition-all text-left"
          >
            <img src={stylist.avatar} alt="" className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{stylist.business_name}</p>
              <p className="text-xs text-primary">{stylist.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-xs font-semibold">{stylist.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">({stylist.review_count})</span>
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {stylist.city}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">€{stylist.hourly_rate}</p>
              <p className="text-[10px] text-muted-foreground">/ora</p>
              <button className="mt-1 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-[10px] font-semibold">
                Book
              </button>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}
