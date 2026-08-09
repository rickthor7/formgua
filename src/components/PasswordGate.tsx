import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PasswordGateProps {
  formTitle: string;
  onUnlock: () => void;
  checkPassword: (password: string) => boolean;
}

export function PasswordGate({ formTitle, onUnlock, checkPassword }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(password)) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <header className="flex items-center justify-between px-4 py-4 relative z-10">
        <span className="text-sm font-bold text-gradient">FormGua</span>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <Lock className="h-7 w-7 text-primary" />
            </motion.div>

            <h2 className="text-lg font-bold mb-1">Form Terkunci</h2>
            <p className="text-xs text-muted-foreground mb-1 truncate">{formTitle}</p>
            <p className="text-xs text-muted-foreground mb-6">Masukkan password untuk mengakses dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Password form"
                  className={`h-11 pr-10 transition-all ${error ? "border-destructive ring-2 ring-destructive/20" : "focus:glow-ring"}`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  Password salah, coba lagi.
                </motion.p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={!password.trim()}>
                Masuk
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      <footer className="py-4 relative z-10 text-center">
        <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} FormGua by rickthor7</span>
      </footer>
    </div>
  );
}
