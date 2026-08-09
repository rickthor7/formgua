import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, ArrowRight, LogIn, UserPlus, Users, Lock, ShieldCheck, Check } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SelectMode() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If already logged in, jump straight to dashboard
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali
            </Link>
          </Button>
          <span className="text-sm font-bold text-gradient">FormGua</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Pilih Cara Memulai
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Login untuk pengalaman penuh & form pribadi, atau lanjut tanpa login dengan proteksi password.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Login mode */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Login / Daftar</h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Form-form yang kamu buat menjadi milik akunmu. Tidak perlu password manual—aksesmu otomatis aman.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground mb-6">
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> Form pribadi tanpa perlu set password</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> Login dengan Email atau Google</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> Akses dari device manapun</li>
            </ul>
            <div className="mt-auto flex flex-col gap-2">
              <Button asChild size="lg" className="gap-2 w-full">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  Masuk Akun
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2 w-full">
                <Link to="/auth?mode=signup">
                  <UserPlus className="h-3.5 w-3.5" />
                  Belum punya akun? Daftar
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Guest mode */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col"
          >
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Lanjutkan Tanpa Login</h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Akses dashboard publik bersama. Form yang kamu buat dilindungi oleh password yang kamu tentukan.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground mb-6">
              <li className="flex gap-2"><Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /> Wajib set password tiap form</li>
              <li className="flex gap-2"><Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /> Bisa langsung pakai tanpa daftar</li>
              <li className="flex gap-2"><Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /> Semua form publik visible</li>
            </ul>
            <div className="mt-auto">
              <Button asChild variant="outline" size="lg" className="gap-2 w-full">
                <Link to="/dashboard">
                  Lanjut Tanpa Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
