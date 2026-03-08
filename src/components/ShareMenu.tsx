import { useState } from "react";
import { Share2, X, MessageCircle, Copy, Check, Phone, Facebook, Instagram, Music2, Briefcase, Search, AtSign } from "lucide-react";
import { toast } from "sonner";

interface ShareMenuProps {
  url?: string;
  title: string;
  description?: string;
  onClose: () => void;
  onChatShare?: () => void;
}

const socials = [
  { id: "whatsapp", label: "WhatsApp", Icon: Phone, color: "bg-green-600", getUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}` },
  { id: "facebook", label: "Facebook", Icon: Facebook, color: "bg-blue-600", getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { id: "instagram", label: "Instagram", Icon: Instagram, color: "bg-pink-600", getUrl: () => `https://www.instagram.com/` },
  { id: "tiktok", label: "TikTok", Icon: Music2, color: "bg-foreground", getUrl: () => `https://www.tiktok.com/` },
  { id: "linkedin", label: "LinkedIn", Icon: Briefcase, color: "bg-blue-700", getUrl: (url: string, text: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { id: "indeed", label: "Indeed", Icon: Search, color: "bg-blue-500", getUrl: () => `https://www.indeed.com/` },
  { id: "twitter", label: "X/Twitter", Icon: AtSign, color: "bg-foreground", getUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
];

export default function ShareMenu({ url, title, description, onClose, onChatShare }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareText = description ? `${title} - ${description}` : title;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiato!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (socialId: string) => {
    const social = socials.find(s => s.id === socialId);
    if (!social) return;
    const targetUrl = social.getUrl(shareUrl, shareText);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch { /* cancelled */ }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-card border-t border-border p-5 pb-8 space-y-4 animate-in slide-in-from-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Condividi</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground truncate">{title}</p>

        {/* Quick actions */}
        <div className="flex gap-3">
          {onChatShare && (
            <button onClick={() => { onChatShare(); onClose(); }} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-[10px] font-medium">Chat</span>
            </button>
          )}
          <button onClick={handleCopy} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
            </div>
            <span className="text-[10px] font-medium">{copied ? "Copiato!" : "Copia"}</span>
          </button>
          {navigator.share && (
            <button onClick={handleNativeShare} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium">Altro</span>
            </button>
          )}
        </div>

        {/* Social grid */}
        <div className="grid grid-cols-4 gap-3">
          {socials.map(social => (
            <button key={social.id} onClick={() => handleShare(social.id)} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-full ${social.color} flex items-center justify-center`}>
                <social.Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{social.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
