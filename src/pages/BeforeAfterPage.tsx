import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import beauty3 from "@/assets/beauty-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";

const beforeAfterItems = [
  {
    id: 1,
    title: "Balayage Transformation",
    stylist: "Martina Rossi",
    before: beauty3,
    after: beauty2,
    likes: 234,
  },
  {
    id: 2,
    title: "Color Correction",
    stylist: "Beauty Rossi",
    before: beauty1,
    after: stylist1,
    likes: 189,
  },
  {
    id: 3,
    title: "Keratin Treatment",
    stylist: "Salon Luxe",
    before: beauty3,
    after: beauty2,
    likes: 312,
  },
];

export default function BeforeAfterPage() {
  const navigate = useNavigate();
  const [sliderPositions, setSliderPositions] = useState<Record<number, number>>(
    Object.fromEntries(beforeAfterItems.map(item => [item.id, 50]))
  );

  const handleSliderChange = (id: number, value: number) => {
    setSliderPositions(prev => ({ ...prev, [id]: value }));
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Before & After</h1>
      </header>

      <div className="p-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          Scopri le trasformazioni dei nostri stilisti ✨
        </p>

        {beforeAfterItems.map(item => (
          <div key={item.id} className="rounded-2xl overflow-hidden bg-card shadow-card fade-in">
            {/* Before/After Slider */}
            <div className="relative aspect-square overflow-hidden">
              {/* After image (background) */}
              <img src={item.after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Before image (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPositions[item.id]}%` }}
              >
                <img
                  src={item.before}
                  alt="Before"
                  className="w-full h-full object-cover"
                  style={{ width: `${100 / (sliderPositions[item.id] / 100)}%`, maxWidth: 'none' }}
                />
              </div>

              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground z-10"
                style={{ left: `${sliderPositions[item.id]}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <div className="flex items-center">
                    <ChevronLeft className="w-3 h-3 text-primary-foreground" />
                    <ChevronRight className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Before</div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full glass text-[10px] font-bold">After</div>

              {/* Range input */}
              <input
                type="range"
                min={10}
                max={90}
                value={sliderPositions[item.id]}
                onChange={e => handleSliderChange(item.id, Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
            </div>

            <div className="p-3">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">by {item.stylist}</p>
              <p className="text-xs text-primary mt-1">❤️ {item.likes} likes</p>
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
}
