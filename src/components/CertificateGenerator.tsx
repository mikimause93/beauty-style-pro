import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CertificateGeneratorProps {
  courseId: string;
  courseTitle: string;
  onGenerated?: (url: string) => void;
}

export default function CertificateGenerator({ courseId, courseTitle, onGenerated }: CertificateGeneratorProps) {
  const { user, profile } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  useEffect(() => {
    checkExisting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const checkExisting = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('certificates')
      .select('certificate_url')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    if (data?.certificate_url) setCertificateUrl(data.certificate_url);
  };

  const generate = async () => {
    if (!user || generating) return;
    setGenerating(true);
    try {
      const certDiv = document.getElementById('certificate-hidden');
      if (!certDiv) { toast.error("Errore generazione certificato"); setGenerating(false); return; }
      
      const canvas = await html2canvas(certDiv, { scale: 2, backgroundColor: '#ffffff' });
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      
      const fileName = `certificate-${user.id}-${courseId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, blob, { contentType: 'image/png' });
      
      if (uploadError) { toast.error("Errore upload certificato"); setGenerating(false); return; }
      
      const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(uploadData.path);
      
      await supabase.from('certificates').insert({
        user_id: user.id,
        course_id: courseId,
        certificate_url: publicUrl,
      });
      
      setCertificateUrl(publicUrl);
      toast.success("Certificato generato!");
      onGenerated?.(publicUrl);
    } catch {
      toast.error("Errore generazione certificato");
    }
    setGenerating(false);
  };

  return (
    <>
      {/* Hidden certificate div for rendering */}
      <div id="certificate-hidden" className="absolute" style={{ left: '-9999px', width: '800px', height: '600px' }}>
        <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 p-12 flex flex-col items-center justify-center border-8 border-gold/30" style={{ fontFamily: 'serif' }}>
          <div className="text-center space-y-6">
            <Award className="w-20 h-20 text-gold mx-auto" />
            <h1 className="text-5xl font-bold text-gray-900">Certificato di Completamento</h1>
            <div className="my-8 space-y-2">
              <p className="text-xl text-gray-600">Si certifica che</p>
              <p className="text-4xl font-bold text-gray-900">{profile?.display_name || 'Studente'}</p>
              <p className="text-xl text-gray-600">ha completato con successo il corso</p>
              <p className="text-3xl font-semibold text-purple-600 mt-4">{courseTitle}</p>
            </div>
            <div className="mt-8 pt-8 border-t-2 border-gray-300">
              <p className="text-sm text-gray-500">Beauty Style Pro Academy</p>
              <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User-facing UI */}
      <div className="text-center py-6">
        {generating ? (
          <div className="flex flex-col items-center gap-3">
            <Award className="w-12 h-12 text-gold animate-pulse" />
            <p className="text-sm text-muted-foreground">Generazione certificato...</p>
          </div>
        ) : certificateUrl ? (
          <div className="space-y-3">
            <Award className="w-12 h-12 text-gold mx-auto" />
            <p className="text-sm font-semibold">Certificato pronto!</p>
            <a href={certificateUrl} target="_blank" rel="noopener" className="inline-block px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
              Scarica Certificato
            </a>
          </div>
        ) : (
          <button onClick={generate} className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            Genera Certificato
          </button>
        )}
      </div>
    </>
  );
}
