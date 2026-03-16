import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !id || !comment.trim()) return;
    setLoading(true);

    // Get booking to find professional_id
    const { data: booking } = await supabase
      .from("bookings")
      .select("professional_id")
      .eq("id", id)
      .maybeSingle();

    if (!booking) {
      toast.error("Prenotazione non trovata");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      booking_id: id,
      client_id: user.id,
      professional_id: booking.professional_id,
      rating,
      comment,
    });

    if (error) {
      toast.error("Errore nell'invio della recensione");
    } else {
      toast.success("Recensione inviata!");
      navigate(-1);
    }
    setLoading(false);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Lascia una Recensione</h1>
      </header>

      <div className="px-4 py-8 space-y-8">
        {/* Rating */}
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Com'è stata la tua esperienza?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="p-1">
                <Star
                  className={`w-10 h-10 transition-all ${
                    star <= rating ? "text-gold fill-gold" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {rating === 5 ? "Eccellente!" : rating === 4 ? "Molto buono" : rating === 3 ? "Nella media" : rating === 2 ? "Sotto le aspettative" : "Scarso"}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Racconta la tua esperienza
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Scrivi la tua recensione..."
            rows={6}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !comment.trim()}
          className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-lg shadow-glow disabled:opacity-50"
        >
          {loading ? "Invio..." : "Invia Recensione"}
        </button>
      </div>
    </MobileLayout>
  );
}
