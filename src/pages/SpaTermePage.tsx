import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Droplets, Flame, Leaf, Sparkles, Star, MapPin, Clock, ChevronRight } from "lucide-react";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";

const categories = [
  { icon: Droplets, label: "Terme", color: "text-blue-400" },
  { icon: Flame, label: "Sauna", color: "text-orange-400" },
  { icon: Leaf, label: "Spa", color: "text-green-400" },
  { icon: Sparkles, label: "Wellness", color: "text-primary" },
];

const treatments = [
  { id: "t1", name: "Percorso Termale Completo", category: "Terme", duration: "120 min", price: 89, rating: 4.9, reviews: 234, image: beauty1, spa: "Terme di Milano", city: "Milano" },
  { id: "t2", name: "Massaggio Hot Stone", category: "Spa", duration: "60 min", price: 65, rating: 4.8, reviews: 189, image: beauty2, spa: "Oasi Wellness", city: "Roma" },
  { id: "t3", name: "Sauna Finlandese + Bagno Turco", category: "Sauna", duration: "90 min", price: 45, rating: 4.7, reviews: 156, image: beauty3, spa: "Nordic Spa", city: "Torino" },
  { id: "t4", name: "Trattamento Viso Anti-Age", category: "Wellness", duration: "45 min", price: 55, rating: 4.9, reviews: 98, image: stylist1, spa: "Beauty Retreat", city: "Firenze" },
  { id: "t5", name: "Fanghi Termali", category: "Terme", duration: "60 min", price: 50, rating: 4.6, reviews: 145, image: stylist2, spa: "Terme Naturali", city: "Napoli" },
  { id: "t6", name: "Percorso Detox Completo", category: "Wellness", duration: "180 min", price: 120, rating: 5.0, reviews: 67, image: beauty1, spa: "Luxury Spa Resort", city: "Venezia" },
];

const tabs = ["Tutti", "Terme", "Spa", "Sauna", "Wellness"];

export default function SpaTermePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Tutti");

  const filtered = activeTab === "Tutti" ? treatments : treatments.filter(t => t.category === activeTab);

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1">Spa & Terme</h1>
          <Droplets className="w-5 h-5 text-primary" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Categories */}
      <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat.label} onClick={() => setActiveTab(cat.label)}
            className="flex flex-col items-center gap-2 min-w-[72px] py-3 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all">
            <cat.icon className={`w-6 h-6 ${cat.color}`} />
            <span className="text-[10px] text-primary/70 font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Featured Banner */}
      <div className="px-4 mb-4">
        <div className="relative rounded-2xl overflow-hidden h-36">
          <img src={beauty2} alt="Spa" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">In evidenza</span>
            <p className="text-sm font-bold text-white mt-0.5">Scopri le migliori Spa vicino a te</p>
            <p className="text-[11px] text-white/70">Trattamenti esclusivi e percorsi benessere</p>
          </div>
        </div>
      </div>

      {/* Treatments List */}
      <div className="px-4 pb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">{activeTab === "Tutti" ? "Tutti i Trattamenti" : activeTab}</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} risultati</span>
        </div>
        {filtered.map(t => (
          <button key={t.id} onClick={() => navigate(`/booking`)}
            className="w-full flex gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all text-left">
            <img src={t.image} alt={t.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.spa}</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{t.city}</span>
                <Clock className="w-3 h-3 text-muted-foreground ml-1" />
                <span className="text-[11px] text-muted-foreground">{t.duration}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-accent fill-accent" />
                  <span className="text-xs font-medium">{t.rating}</span>
                  <span className="text-[10px] text-muted-foreground">({t.reviews})</span>
                </div>
                <span className="text-sm font-bold text-primary">€{t.price}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}
