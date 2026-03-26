import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-glow">
        <Sparkles className="h-9 w-9 text-white drop-shadow-sm" />
      </div>
      <h1 className="font-display mb-2 text-6xl font-bold text-gradient-luxury">404</h1>
      <p className="mb-1 text-lg font-semibold">Pagina non trovata</p>
      <p className="mb-8 text-sm text-muted-foreground">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-2xl gradient-primary px-6 py-3 text-sm font-bold text-white shadow-glow transition-all duration-200 active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla home
      </button>
    </div>
  );
};

export default NotFound;
