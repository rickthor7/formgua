import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { popup } from "@/lib/swal";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Loader2, ArrowLeft, QrCode } from "lucide-react";

export default function JoinQuiz() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code?: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 7);
    if (clean.length < 6) {
      popup.error("Kode kuis minimal 6 digit");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("forms")
      .select("id, slug, status, form_type")
      .eq("join_code", clean)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      popup.error("Kode kuis tidak ditemukan");
      return;
    }
    if (data.status !== "active") {
      popup.error("Kuis belum aktif atau sudah ditutup");
      return;
    }
    navigate(`/form/${data.slug || data.id}`);
  };

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode);
      lookup(urlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Google brand stripe */}
      <div className="absolute inset-x-0 top-0 flex h-1">
        <div className="flex-1 bg-[#4285F4]" />
        <div className="flex-1 bg-[#EA4335]" />
        <div className="flex-1 bg-[#FBBC05]" />
        <div className="flex-1 bg-[#34A853]" />
      </div>

      <header className="flex items-center justify-between px-4 sm:px-6 py-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Beranda
        </Link>
        <ThemeToggle />
      </header>

      <main className="max-w-md mx-auto px-4 pt-10 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gabung Kuis</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Masukkan <b>kode 6 digit</b> yang diberikan pembuat kuis, atau <b>scan QR</b> dari mereka.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={(e) => {
            e.preventDefault();
            lookup(code);
          }}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kode Kuis</label>
            <Input
              inputMode="numeric"
              pattern="\d*"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              autoFocus
              className="mt-2 text-center text-3xl sm:text-4xl font-mono font-bold tracking-[0.35em] h-16"
            />
          </div>
          <Button type="submit" disabled={loading || code.length < 6} className="w-full h-11 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? "Mencari..." : "Masuk Kuis"}
          </Button>
        </motion.form>

        <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          <QrCode className="h-5 w-5 mx-auto mb-2 opacity-60" />
          Kalau ada <b>QR code</b>, buka kamera HP kamu lalu scan — kamu akan otomatis diarahkan ke kuisnya.
        </div>
      </main>
    </div>
  );
}
