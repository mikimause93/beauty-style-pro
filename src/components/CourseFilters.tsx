import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Star } from "lucide-react";

interface CourseFiltersProps {
  onFilterChange: (filters: {
    category: string[];
    level: string[];
    priceRange: [number, number];
    minRating: number;
  }) => void;
}

const categories = [
  { value: "professional", label: "Professionista Beauty" },
  { value: "client", label: "Cliente" },
  { value: "newbie", label: "Principiante" },
];

const levels = [
  { value: "beginner", label: "Base" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzato" },
];

export default function CourseFilters({ onFilterChange }: CourseFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minRating, setMinRating] = useState(0);

  const toggleCategory = (cat: string) => {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(updated);
  };

  const toggleLevel = (lvl: string) => {
    const updated = selectedLevels.includes(lvl)
      ? selectedLevels.filter((l) => l !== lvl)
      : [...selectedLevels, lvl];
    setSelectedLevels(updated);
  };

  const applyFilters = () => {
    onFilterChange({
      category: selectedCategories,
      level: selectedLevels,
      priceRange,
      minRating,
    });
    setShowFilters(false);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceRange([0, 500]);
    setMinRating(0);
    onFilterChange({ category: [], level: [], priceRange: [0, 500], minRating: 0 });
  };

  const activeFilterCount = selectedCategories.length + selectedLevels.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0);

  return (
    <>
      <button
        onClick={() => setShowFilters(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold relative"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtri
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[85vh] glass rounded-t-3xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">Filtri</h3>
                <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-5">
                <p className="text-sm font-semibold mb-2">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedCategories.includes(cat.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Levels */}
              <div className="mb-5">
                <p className="text-sm font-semibold mb-2">Livello</p>
                <div className="flex flex-wrap gap-2">
                  {levels.map((lvl) => (
                    <button
                      key={lvl.value}
                      onClick={() => toggleLevel(lvl.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedLevels.includes(lvl.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <p className="text-sm font-semibold mb-2">Fascia di Prezzo</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  €{priceRange[0]} - €{priceRange[1]}
                </p>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-2">Valutazione Minima</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)} className="flex items-center">
                      <Star className={`w-6 h-6 ${r <= minRating ? "text-gold fill-gold" : "text-muted"}`} />
                    </button>
                  ))}
                  {minRating > 0 && (
                    <button onClick={() => setMinRating(0)} className="text-xs text-muted-foreground ml-2">
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={clearAll} className="flex-1 py-3 rounded-xl bg-card border border-border font-semibold text-sm">
                  Cancella
                </button>
                <button onClick={applyFilters} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
                  Applica Filtri
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
