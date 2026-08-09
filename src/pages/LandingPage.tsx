import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  FileText, BarChart3, Palette, Zap, ArrowRight, CheckCircle2, Share2, Gift,
  Lock, Bell, Copy, Move, Sparkles, Star, ShieldCheck, Users,
} from "lucide-react";

const features = [
  { icon: Move, title: "Drag & Drop Builder", desc: "Susun ulang pertanyaan dengan drag & drop. 9+ tipe input termasuk Variabel 1-5 (Likert)." },
  { icon: Palette, title: "Tema & Branding", desc: "Pilih warna aksen, gaya tombol, dan buat form sesuai identitas brand kamu." },
  { icon: BarChart3, title: "Dashboard Analitik", desc: "Pantau respons real-time dengan visualisasi chart Bar, Pie, dan Line otomatis." },
  { icon: Sparkles, title: "Analisis Data AI", desc: "Ketik perintah, AI menjalankan uji korelasi, t-test, regresi, & statistik deskriptif." },
  { icon: Gift, title: "Giveaway Spin Wheel", desc: "Aktifkan giveaway dengan roda putar interaktif. Pemenang otomatis di-redirect ke WhatsApp." },
  { icon: Lock, title: "Proteksi Password", desc: "Lindungi form sensitif dengan password gate sebelum responden bisa mengisi." },
  { icon: Bell, title: "Notifikasi Email", desc: "Dapatkan email instan setiap kali ada respons baru masuk ke form kamu." },
  { icon: Copy, title: "Duplikasi Form", desc: "Salin form lengkap dengan semua pertanyaan & pengaturan dalam sekali klik." },
  { icon: CheckCircle2, title: "Ekspor CSV", desc: "Unduh semua respons dalam format CSV kapan saja untuk analisis lanjutan." },
];

const stats = [
  { value: "9+", label: "Tipe pertanyaan" },
  { value: "100%", label: "Gratis dipakai" },
  { value: "AI", label: "Analisis statistik" },
  { value: "Real-time", label: "Dashboard respons" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Top Google stripe */}
      <div className="h-1 w-full google-stripe" />

      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[420px] h-[420px] bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-premium text-primary-foreground">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-gradient">FormGua</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/kuis">Gabung Kuis</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/panduan">Panduan</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/faq">FAQ</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs hidden sm:inline-flex">
              <Link to="/tentang">Tentang</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs hidden md:inline-flex">
              <Link to="/changelog">Changelog</Link>
            </Button>
            <ThemeToggle />
            <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
              <Link to="/pilih-mode">
                <span className="hidden sm:inline">Mulai Sekarang</span>
                <span className="sm:hidden">Mulai</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 12 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary text-xs font-medium mb-6"
          >
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--g-blue))" }} />
              <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--g-red))" }} />
              <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--g-yellow))" }} />
              <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--g-green))" }} />
            </span>
            Form Builder Modern & Gratis
          </motion.div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Buat Form dengan{" "}
            <span className="text-gradient">Mudah & Indah</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            FormGua membantu kamu membuat formulir profesional, mengumpulkan data, dan menganalisis respons dengan AI — semua dalam satu platform yang elegan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
              <Link to="/pilih-mode">
                Mulai Buat Form
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a href="#fitur">Lihat Fitur</a>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Data terenkripsi</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-primary" /> Tanpa registrasi</span>
          </div>
        </motion.div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 sm:mt-16 mx-auto max-w-3xl"
        >
          <div className="glass-card rounded-2xl p-3 sm:p-4 shadow-2xl">
            <div className="bg-muted/50 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full" style={{ background: "hsl(var(--g-red))" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "hsl(var(--g-yellow))" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "hsl(var(--g-green))" }} />
                <div className="flex-1 mx-4 h-6 bg-muted rounded-md" />
              </div>
              <div className="space-y-3">
                <div className="h-8 bg-primary/15 rounded-lg w-3/4" />
                <div className="h-4 bg-muted-foreground/10 rounded w-1/2" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="h-20 bg-primary/10 rounded-xl border border-primary/15" />
                  <div className="h-20 bg-accent/10 rounded-xl border border-accent/15" />
                </div>
                <div className="h-10 bg-primary rounded-lg w-32 mt-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats band */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p className="text-xl sm:text-2xl font-extrabold text-gradient">{s.value}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Semua yang Kamu Butuhkan</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">Fitur lengkap untuk membuat, mengelola, dan menganalisis formulir online.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group rounded-xl border border-border bg-card p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1.5">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-premium p-8 sm:p-14 text-center text-primary-foreground"
        >
          <div className="absolute inset-x-0 top-0 h-1 google-stripe" />
          <Users className="h-8 w-8 mx-auto mb-4 opacity-90" />
          <h2 className="text-xl sm:text-3xl font-bold mb-3">Siap Membuat Form Pertamamu?</h2>
          <p className="text-sm sm:text-base mb-6 max-w-lg mx-auto opacity-90">
            Mulai gratis, tanpa registrasi. Langsung buat dan bagikan form ke siapa saja.
          </p>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link to="/pilih-mode">
              Buat Form Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-gradient">FormGua</span>
          <span>
            © {new Date().getFullYear()} FormGua by{" "}
            <a
              href="https://instagram.com/iam.rickthor7"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline transition-colors"
            >
              rickthor7
            </a>
            . All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
