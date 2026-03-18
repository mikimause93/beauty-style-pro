import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Award, BookOpen, Users, TrendingUp, Clock, Star, ArrowRight, CheckCircle, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const tracks = [
  {
    title: "Professionista Beauty",
    description: "Master avanzato per beauty professional",
    duration: "12 settimane",
    modules: 45,
    price: "€49.99/mese",
    icon: Crown,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Content Creator",
    description: "Diventa un influencer beauty di successo",
    duration: "8 settimane",
    modules: 30,
    price: "€29.99/mese",
    icon: TrendingUp,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Gestione Salone",
    description: "Imprenditoria e business nel beauty",
    duration: "10 settimane",
    modules: 35,
    price: "€39.99/mese",
    icon: Zap,
    gradient: "from-orange-500 to-red-500",
  },
];

const pricingTiers = [
  {
    name: "Gratuito",
    price: "€0",
    period: "per sempre",
    features: ["3 corsi base gratuiti", "Accesso community", "Certificati digitali", "Supporto via email"],
    cta: "Inizia Gratis",
    popular: false,
  },
  {
    name: "Studente",
    price: "€19.99",
    period: "/mese",
    features: ["Accesso a tutti i corsi", "Download materiali", "Certificati premium", "Supporto prioritario", "Live Q&A settimanali"],
    cta: "Inizia 7 giorni gratis",
    popular: true,
  },
  {
    name: "Pro",
    price: "€49.99",
    period: "/mese",
    features: ["Tutto di Studente +", "Corsi esclusivi Pro", "1-on-1 mentorship", "Network eventi VIP", "Job placement"],
    cta: "Sblocca Pro",
    popular: false,
  },
];

const stories = [
  {
    name: "Martina R.",
    before: "Estetista freelance",
    after: "Salone proprietaria + 12K followers",
    quote: "Ho aperto il mio primo salone dopo 6 mesi di formazione. I corsi mi hanno dato sicurezza e competenze reali.",
    avatar: "MR",
  },
  {
    name: "Luca S.",
    before: "Barbiere tradizionale",
    after: "Content creator 85K Instagram",
    quote: "Il percorso Content Creator ha trasformato il mio business. Ora collaboro con brand internazionali.",
    avatar: "LS",
  },
  {
    name: "Elena N.",
    before: "Studentessa",
    after: "Makeup artist professionista",
    quote: "Da zero a professionista in 3 mesi. Ho trovato lavoro prima ancora di finire il corso.",
    avatar: "EN",
  },
];

export default function FormationPage() {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("enrolled_count", { ascending: false })
      .limit(6);
    setFeaturedCourses(data || [
      { id: '1', title: 'Fondamenti di Makeup', thumbnail_url: '', price: 29, enrolled_count: 450, rating: 4.8, duration_minutes: 180 },
      { id: '2', title: 'Hair Styling Avanzato', thumbnail_url: '', price: 49, enrolled_count: 320, rating: 4.9, duration_minutes: 240 },
      { id: '3', title: 'Business del Beauty', thumbnail_url: '', price: 39, enrolled_count: 280, rating: 4.7, duration_minutes: 200 },
    ]);
    setLoading(false);
  };

  return (
    <MobileLayout>
      {/* Hero Section */}
      <div className="relative gradient-primary pt-12 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Award className="w-16 h-16 text-primary-foreground mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-display font-bold text-primary-foreground mb-3">Beauty Style Pro Academy</h1>
          <p className="text-primary-foreground/90 text-sm max-w-sm mx-auto mb-6">
            Formazione professionale per diventare un esperto beauty. Corsi certificati, mentorship e community.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-2.5 rounded-xl bg-background text-foreground font-semibold text-sm shadow-lg">
              Esplora Corsi
            </button>
            <button onClick={() => navigate("/formation/creator-dashboard")} className="px-5 py-2.5 rounded-xl bg-background/20 text-primary-foreground font-semibold text-sm backdrop-blur">
              Diventa Creator
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-8 relative z-10">
        {[
          { label: "Studenti", value: "2.5K+", icon: Users },
          { label: "Corsi", value: "150+", icon: BookOpen },
          { label: "Job Rate", value: "95%", icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="chrome-card p-4 text-center"
          >
            <stat.icon className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Learning Tracks */}
      <div className="p-4 mt-6">
        <h2 className="text-xl font-display font-bold mb-4">Percorsi di Formazione</h2>
        <div className="space-y-3">
          {tracks.map((track) => (
            <button
              key={track.title}
              onClick={() => navigate(`/formation/course/${track.title.toLowerCase().replace(/\s+/g, '-')}`)}
              className="w-full text-left chrome-card p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.gradient} flex items-center justify-center flex-shrink-0`}>
                  <track.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{track.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{track.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {track.duration}
                    </span>
                    <span>·</span>
                    <span>{track.modules} moduli</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{track.price}</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-2" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="p-4 mt-6 bg-muted/30">
        <h2 className="text-xl font-display font-bold mb-4 text-center">Scegli il tuo Piano</h2>
        <div className="space-y-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`chrome-card p-5 ${tier.popular ? "border-primary border-2 relative" : ""}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
                  Più Popolare
                </span>
              )}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1 my-2">
                  <span className="text-3xl font-display font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/formation/subscription")} className={`w-full py-2.5 rounded-xl font-semibold text-sm ${tier.popular ? "gradient-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Courses */}
      <div id="courses" className="p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">Corsi in Evidenza</h2>
          <button onClick={() => navigate("/formation/creator-dashboard")} className="text-xs text-primary font-semibold">
            Vedi tutti →
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featuredCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => navigate(`/formation/course/${course.id}`)}
                className="text-left chrome-card overflow-hidden hover:border-primary/30 transition-all"
              >
                {course.thumbnail_url && (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-24 object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2 mb-2">{course.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span>{course.rating || 4.5}</span>
                    <span>·</span>
                    <span>{course.enrolled_count || 0} studenti</span>
                  </div>
                  <p className="text-primary font-bold text-sm">
                    {course.price > 0 ? `€${course.price}` : "Gratis"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Success Stories */}
      <div className="p-4 mt-6 bg-card">
        <h2 className="text-xl font-display font-bold mb-4 text-center">Storie di Successo</h2>
        <div className="space-y-4">
          {stories.map((story) => (
            <div key={story.name} className="chrome-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {story.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{story.name}</p>
                  <p className="text-xs text-muted-foreground">{story.before} → {story.after}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">"{story.quote}"</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-20" />
    </MobileLayout>
  );
}
