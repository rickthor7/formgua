import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { popup } from "@/lib/swal";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      navigate(data ? "/admin" : "/dashboard", { replace: true });
    })();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: displayName.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        popup.success("Akun berhasil dibuat!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        popup.success("Login berhasil!");
      }
    } catch (err: any) {
      popup.error(err?.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
      // Browser akan redirect ke Google
    } catch (err: any) {
      popup.error(err?.message || "Gagal login dengan Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
            <Link to="/pilih-mode">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali
            </Link>
          </Button>
          <span className="text-sm font-bold text-gradient">FormGua</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">
              {mode === "login" ? "Masuk Akun" : "Buat Akun Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === "login" ? "Lanjutkan kelola form-form pribadimu" : "Daftar untuk form pribadi tanpa password manual"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 mb-4"
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Lanjutkan dengan Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-background px-2 text-muted-foreground">Atau dengan email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Nama Tampilan (opsional)</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama panggilan kamu"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min 6 karakter" : "Password kamu"}
                  className="pr-10"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting || googleLoading}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            {mode === "login" ? (
              <>
                Belum punya akun?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                  Daftar
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                  Masuk
                </button>
              </>
            )}
          </p>

          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Atau{" "}
            <Link to="/dashboard" className="underline hover:text-foreground">
              lanjut tanpa login
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
