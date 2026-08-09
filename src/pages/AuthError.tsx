import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertTriangle,
  ArrowLeft,
  LogIn,
  Users,
  RefreshCw,
  Mail,
} from "lucide-react";

export default function AuthError() {
  const [params] = useSearchParams();
  const code = params.get("code") || "unknown_error";
  const description = params.get("description") || "";

  // Deteksi tipe error untuk pesan ramah
  const isAccessDenied = /access_denied|denied|cancel/i.test(code + description);
  const isProviderIssue =
    /provider|oauth|invalid_request|server_error|temporarily/i.test(
      code + description,
    );

  const friendlyTitle = isAccessDenied
    ? "Login Google Dibatalkan"
    : isProviderIssue
      ? "Login Google Sedang Bermasalah"
      : "Gagal Login dengan Google";

  const friendlyMessage = isAccessDenied
    ? "Sepertinya kamu membatalkan proses login di halaman Google. Tidak apa-apa — kamu bisa coba lagi atau pakai cara lain di bawah."
    : "Maaf, kami tidak bisa menyelesaikan login dengan akun Google kamu saat ini. Ini bisa terjadi karena pengaturan provider, koneksi, atau masalah sementara di Google. Tenang, kamu masih bisa lanjut pakai cara lain.";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Beranda
            </Link>
          </Button>
          <span className="text-sm font-bold text-gradient">FormGua</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-6 sm:p-8 text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-5">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
            {friendlyTitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {friendlyMessage}
          </p>

          <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6 text-left">
            <p className="text-xs font-semibold mb-2">Coba salah satu cara ini:</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                Masuk pakai email & password biasa
              </li>
              <li className="flex gap-2">
                <Users className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                Lanjut tanpa login (mode tamu) — form tetap bisa dibuat dengan password
              </li>
              <li className="flex gap-2">
                <RefreshCw className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                Atau coba lagi beberapa saat lagi
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="gap-2 w-full">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Masuk dengan Email & Password
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 w-full">
              <Link to="/dashboard">
                <Users className="h-4 w-4" />
                Lanjut Tanpa Login
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2 w-full">
              <Link to="/pilih-mode">
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Pilih Mode
              </Link>
            </Button>
          </div>

          {(code !== "unknown_error" || description) && (
            <details className="mt-6 text-left">
              <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                Detail teknis (untuk developer)
              </summary>
              <div className="mt-2 rounded-lg bg-muted/40 p-3 text-[11px] font-mono text-muted-foreground break-words">
                <div><span className="font-semibold">code:</span> {code}</div>
                {description && (
                  <div className="mt-1">
                    <span className="font-semibold">message:</span> {description}
                  </div>
                )}
              </div>
            </details>
          )}
        </motion.div>
      </main>
    </div>
  );
}
