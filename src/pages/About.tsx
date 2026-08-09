import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Instagram, FileText, Gift, BarChart3, Lock, Palette, Layers, Mail, ImageIcon, Zap, ExternalLink, ShieldAlert, Timer, GraduationCap, UserCheck, FileSpreadsheet, MessageSquare, ShieldCheck, Server, KeyRound, EyeOff } from "lucide-react";
import rickthorAvatar from "@/assets/rickthor7-avatar.webp";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon: FileText, title: "Form Builder Drag & Drop", desc: "Susun pertanyaan mudah dengan urutan & logika bercabang Ya/Tidak" },
  { icon: GraduationCap, title: "Form Kuis + Skor Otomatis", desc: "Kunci jawaban, poin benar/salah, skor dihitung otomatis saat submit" },
  { icon: Timer, title: "Timer Kuis Anti-Curang", desc: "Batas waktu total, peringatan 30 detik, auto-submit saat habis" },
  { icon: ShieldAlert, title: "Anti-Cheat & Deteksi Kecurangan", desc: "Blokir copy/klik kanan, deteksi pindah tab, fokus hilang & PrintScreen" },
  { icon: ShieldAlert, title: "Dashboard Aktivitas Mencurigakan", desc: "Lihat siapa & berapa kali curang, lengkap dengan jenis dan waktunya" },
  { icon: UserCheck, title: "Login Email & Google", desc: "Login dengan email/password atau Google — atau lanjut tanpa login" },
  { icon: Palette, title: "Kustomisasi Tema", desc: "Pilih warna aksen, gaya tombol, dan font sesuai brand-mu" },
  { icon: Layers, title: "2 Mode Tampilan", desc: "Per-halaman ala Typeform atau scroll panjang ala Google Form" },
  { icon: ImageIcon, title: "Banner Cover/Contain", desc: "Upload banner 1600×400 dengan mode Cover atau Contain" },
  { icon: Gift, title: "Giveaway Saldo E-Wallet", desc: "Beri reward DANA / OVO / GoPay otomatis ke responden terpilih" },
  { icon: BarChart3, title: "Analitik Realtime Per User", desc: "Chart respons mingguan update otomatis dari form milikmu sendiri" },
  { icon: FileSpreadsheet, title: "Ekspor CSV & Excel", desc: "Ekspor data ke CSV atau Excel (XLSX) dengan lebar kolom otomatis" },
  { icon: Mail, title: "Notifikasi Email + Cheat Log", desc: "Email tiap respons baru — termasuk rangkuman aktivitas mencurigakan" },
  { icon: Lock, title: "Password per Form", desc: "Lindungi dashboard form mode tamu dengan password sendiri" },
  { icon: MessageSquare, title: "Notifikasi Popup Tematik", desc: "Popup elegan berbahasa Indonesia menyesuaikan tema light/dark" },
];

const socials = [
  {
    name: "Instagram",
    handle: "@iam.rickthor7",
    url: "https://instagram.com/iam.rickthor7",
    icon: Instagram,
    gradient: "from-purple-500 via-pink-500 to-orange-500",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/panduan" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Panduan
            </Link>
            <Link to="/faq" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link to="/dashboard" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative z-10 space-y-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur text-xs font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Tentang FormGua
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Form builder yang{" "}
            <span className="text-gradient">tidak monoton.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            FormGua adalah platform pembuatan form online buatan anak Indonesia — dirancang untuk kreator,
            UMKM, mahasiswa, dan siapa saja yang butuh form survei, registrasi, atau giveaway dengan tampilan
            yang lebih segar dari yang biasa kamu temui.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
            >
              Mulai Buat Form
              <Zap className="h-4 w-4" />
            </Link>
            <Link
              to="/panduan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card/50 backdrop-blur font-semibold text-sm hover:border-primary/40 hover:text-primary transition-all"
            >
              Baca Panduan
            </Link>
          </div>
        </motion.section>

        {/* Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Kenapa FormGua?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Form online seharusnya tidak hanya soal tanya-jawab. FormGua dibuat untuk membuat
              proses isi form jadi pengalaman yang menyenangkan — dengan animasi halus, tema yang
              bisa disesuaikan, dan fitur giveaway yang bikin responden makin semangat ngisi.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Gift className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Untuk siapa?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cocok untuk kreator konten yang mau bikin survei audience, UMKM yang butuh form
              order, mahasiswa yang lagi nyari responden skripsi, sampai event organizer yang
              ingin memberi hadiah saldo e-wallet ke peserta.
            </p>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Fitur Unggulan</h2>
            <p className="text-sm text-muted-foreground">Semua yang kamu butuhkan untuk bikin form yang lebih hidup</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Keamanan & Privasi */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-[11px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Keamanan & Privasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Datamu Aman, Tidak Diintip Siapapun</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Form & respons kamu dilindungi berlapis: enkripsi saat dikirim, enkripsi saat disimpan, dan kontrol akses ketat per akun.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Lock, title: "Enkripsi In-Transit (TLS 1.3)", desc: "Setiap data form & jawaban dikirim lewat HTTPS dengan TLS 1.3 — tidak bisa disadap di jaringan publik / WiFi kafe." },
              { icon: Server, title: "Enkripsi At-Rest (AES-256)", desc: "Database & file bukti tersimpan terenkripsi AES-256 di sisi server. File mentah tidak terbaca walau penyimpanan fisik dicuri." },
              { icon: KeyRound, title: "Row-Level Security (RLS)", desc: "Form pribadimu hanya bisa diakses akunmu. Database menolak akses lintas-user di level engine, bukan sekadar di kode aplikasi." },
              { icon: EyeOff, title: "Tidak Dijual, Tidak Diintip", desc: "Kami tidak menjual data ke pihak ketiga, tidak menampilkan iklan dari isi form, dan tidak membaca jawaban responden untuk profiling." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 border-emerald-500/20"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                  <s.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-[11px] text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            <p className="font-semibold text-foreground mb-1">Catatan transparansi</p>
            FormGua memakai enkripsi tingkat industri (TLS untuk transit, AES-256 untuk at-rest) dan Row-Level Security yang dijaga ketat.
            Untuk fitur seperti notifikasi email & generate AI, sebagian data form perlu diproses oleh server kami — jadi ini bukan
            <em className="not-italic font-semibold"> end-to-end encrypted</em> dalam arti murni. Kami sengaja jujur supaya kamu paham
            persis bagaimana data dilindungi dan oleh siapa.
          </div>
        </motion.section>

        {/* Creator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="glass-card rounded-3xl p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative grid md:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-center">
              {/* Avatar */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 blur-md opacity-70" />
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden ring-4 ring-background shadow-xl">
                  <img
                    src={rickthorAvatar}
                    alt="Foto rickthor7"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 text-center md:text-left">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Dibuat oleh
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold">rickthor7</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Solo developer · Pencinta produk web yang rapi & menyenangkan
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Halo! Aku yang ngerakit FormGua dari nol. Project ini lahir dari kegemaran
                  bikin form yang nggak ngebosenin dan keinginan punya tools sendiri yang bisa
                  diatur sebebas mungkin. Kalau ada masukan, bug, atau mau ngobrol — DM aja!
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                  {socials.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-background/50 backdrop-blur hover:border-transparent hover:shadow-lg transition-all relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className={`relative h-8 w-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-md`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="relative flex flex-col items-start leading-tight">
                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-white/80 transition-colors">
                          {s.name}
                        </span>
                        <span className="text-sm font-bold group-hover:text-white transition-colors">
                          {s.handle}
                        </span>
                      </div>
                      <ExternalLink className="relative h-3.5 w-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 pb-4"
        >
          <h2 className="text-2xl sm:text-3xl font-bold">Siap bikin form pertamamu?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Gratis selamanya. Tanpa batas jumlah form & respons.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Buka Dashboard
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </motion.section>
      </main>

      <footer className="border-t border-border py-5 mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FormGua by{" "}
          <a
            href="https://instagram.com/iam.rickthor7"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            rickthor7
          </a>
        </div>
      </footer>
    </div>
  );
}
