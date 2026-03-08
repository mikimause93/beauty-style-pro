import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, User, Lock, Bell, Mail, Moon, Globe, HelpCircle, FileText, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = async () => {
    await signOut();
    toast.success("Disconnesso");
    navigate("/auth");
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all relative ${value ? "bg-primary" : "bg-muted"}`}
    >
      <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Impostazioni</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</p>
          <div className="space-y-2">
            <button onClick={() => navigate("/profile/edit")} className="w-full flex items-center gap-3 p-4 rounded-xl bg-card text-left">
              <User className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Modifica Profilo</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-card text-left">
              <Lock className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Cambia Password</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notifiche</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card">
              <Bell className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Push Notifications</span>
              <Toggle value={pushNotif} onChange={setPushNotif} />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card">
              <Mail className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Email Notifications</span>
              <Toggle value={emailNotif} onChange={setEmailNotif} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preferenze</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card">
              <Moon className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Dark Mode</span>
              <Toggle value={darkMode} onChange={setDarkMode} />
            </div>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-card text-left">
              <Globe className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Lingua</span>
              <span className="text-sm text-muted-foreground mr-1">Italiano</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>

        {/* Support */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Supporto</p>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-card text-left">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Centro Assistenza</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-card text-left">
              <FileText className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Termini e Condizioni</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-card text-left">
              <Shield className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Privacy Policy</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-destructive text-destructive font-semibold">
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <p className="text-center text-xs text-muted-foreground">Version 1.0.0</p>
      </div>
    </MobileLayout>
  );
}
