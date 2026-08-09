import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  ArrowRight,
  BookOpen,
  Plus,
  Lock,
  Palette,
  Gift,
  Bell,
  Share2,
  BarChart3,
  Layout,
  Edit3,
  Copy,
  Trash2,
  ListChecks,
  Eye,
  Zap,
  UserCheck,
  Image as ImageIcon,
  Timer,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    title: "1. Pilih Mode: Login atau Tamu",
    desc: "Saat klik 'Mulai', kamu diarahkan ke halaman pilih mode. Pilih Login (form jadi milik akunmu, tanpa password manual) atau Lanjut Tanpa Login (form publik, butuh password untuk dikelola). Login tersedia via email/password atau Google.",
  },
  {
    icon: Plus,
    title: "2. Membuat Form Baru",
    desc: "Di Dashboard, klik 'Form Baru'. Pilih jenis form: Bebas, Responden (skala likert 1-5), atau Kuis (dengan kunci jawaban & skor). Lalu isi judul, deskripsi singkat, dan konfigurasi awal.",
  },
  {
    icon: Lock,
    title: "3. Password Form (Mode Tamu)",
    desc: "Hanya berlaku untuk mode tamu. Password digunakan untuk membuka builder, melihat respons, dan menghapus form. Jika kamu login, password otomatis dilewati karena akses dilindungi akunmu.",
  },
  {
    icon: Layout,
    title: "4. Memilih Layout Form",
    desc: "Pilih antara dua mode tampilan: 'Per Halaman' (modern, satu pertanyaan per slide) atau 'Scroll Penuh' (klasik mirip Google Form, semua pertanyaan dalam satu halaman).",
  },
  {
    icon: ImageIcon,
    title: "5. Upload Banner Form",
    desc: "Di builder, upload banner form dengan ukuran ideal 1600 × 400 px (rasio 4:1). Pilih mode tampilan: 'Cover' (gambar dipotong agar penuh) atau 'Contain' (gambar paskan, tidak terpotong).",
  },
  {
    icon: Edit3,
    title: "6. Menambah Pertanyaan",
    desc: "Klik tipe field dari panel kiri (Teks, Pilihan Ganda, Likert 1-5, Email, Nomor HP, Upload File, dll). Drag & drop untuk mengubah urutan. Setiap field bisa diatur required, deskripsi, dan opsi tambahan.",
  },
  {
    icon: ListChecks,
    title: "7. Skala Likert: Mendatar atau Menurun",
    desc: "Untuk field Likert 1-5, kamu bisa pilih orientasi tampilan: 'Mendatar' (default, opsi sejajar) atau 'Menurun' (opsi tersusun ke bawah). Pengaturan tersimpan per pertanyaan.",
  },
  {
    icon: ListChecks,
    title: "8. Logika Bercabang (Ya/Tidak)",
    desc: "Untuk field Ya/Tidak, kamu bisa menambahkan pertanyaan lanjutan berbeda berdasarkan jawaban. Default: muncul 5 sub-pertanyaan per cabang yang bisa kamu sesuaikan.",
  },
  {
    icon: GraduationCap,
    title: "9. Form Kuis: Kunci Jawaban & Skor",
    desc: "Pada form Kuis, setiap soal wajib punya kunci jawaban dan poin (benar/salah). Sistem otomatis menghitung skor responden setelah submit. Cocok untuk ujian, tes pelajaran, atau quiz berhadiah.",
  },
  {
    icon: Timer,
    title: "10. Batas Waktu Kuis",
    desc: "Aktifkan timer di header Form Builder untuk kuis. Timer total berlaku untuk seluruh kuis. Saat waktu hampir habis ada peringatan, dan akan auto-submit otomatis ketika waktu habis.",
  },
  {
    icon: Palette,
    title: "11. Mengubah Tema & Desain",
    desc: "Di tab 'Tema' pada builder, pilih warna aksen (Biru, Ungu, Hijau, Pink, Teal, Orange, dll), gaya tombol (Solid, Outline, Gradient, Glow, Soft), dan font yang sesuai brand kamu.",
  },
  {
    icon: Gift,
    title: "12. Mengaktifkan Giveaway",
    desc: "Aktifkan giveaway saat membuat form. Pilih mode 'Rata' (semua pemenang dapat nominal sama) atau 'Acak' (nominal acak per pemenang, kelipatan 500). Tentukan total hadiah, jumlah pemenang, dan e-wallet (DANA, OVO, GoPay, dll).",
  },
  {
    icon: Bell,
    title: "13. Notifikasi Email",
    desc: "Aktifkan notifikasi email dan masukkan alamat email kamu. Setiap kali ada respons baru, kamu akan langsung mendapat email pemberitahuan.",
  },
  {
    icon: Share2,
    title: "14. Membagikan Form",
    desc: "Klik ikon 'Buka' di daftar form untuk mendapatkan link publik. Setiap form punya slug URL unik yang ramah SEO dan mudah dibagikan via WhatsApp atau media sosial.",
  },
  {
    icon: BarChart3,
    title: "15. Analitik Realtime",
    desc: "Lihat 'Respons Minggu Ini' di Dashboard yang update realtime — bisa diubah ke grafik Area, Bar, atau Line. Klik ikon 'Respons' pada form untuk melihat semua jawaban dengan visualisasi otomatis dan ekspor ke CSV/Excel.",
  },
  {
    icon: Copy,
    title: "16. Menduplikasi Form",
    desc: "Punya form serupa? Klik ikon duplikasi pada form yang ingin disalin. Semua pertanyaan dan pengaturan akan disalin sebagai form baru berstatus draft.",
  },
  {
    icon: Trash2,
    title: "17. Menghapus Form",
    desc: "Klik ikon hapus. Untuk akun login, langsung dihapus. Untuk mode tamu, masukkan password form sebagai konfirmasi. Form & semua respons dihapus permanen — pastikan ekspor data dulu.",
  },
  {
    icon: MessageSquare,
    title: "18. Notifikasi Popup Tematik",
    desc: "Setiap aksi (sukses simpan, error, konfirmasi) ditampilkan dalam popup elegan berbahasa Indonesia di tengah layar yang otomatis menyesuaikan tema light/dark website.",
  },
  {
    icon: ShieldAlert,
    title: "19. Anti-Cheat di Form Kuis",
    desc: "Khusus form Kuis: teks soal tidak bisa diseleksi/copy, klik kanan diblokir, shortcut Ctrl+C/X/P/S dimatikan. Sistem juga mendeteksi pindah tab, kehilangan fokus jendela, dan penekanan PrintScreen.",
  },
  {
    icon: ShieldAlert,
    title: "20. Dashboard Aktivitas Mencurigakan",
    desc: "Di halaman Respons form Kuis ada panel khusus berisi daftar responden yang melakukan pelanggaran lengkap dengan jenis, jumlah, dan waktu detail tiap kejadian. Author juga otomatis mendapat email rangkuman.",
  },
  {
    icon: BarChart3,
    title: "21. Dashboard Realtime Per User",
    desc: "Untuk pengguna login, chart 'Respons Minggu Ini' di Dashboard hanya menampilkan data form milikmu sendiri dan langsung update otomatis (realtime) saat ada respons baru.",
  },
  {
    icon: FileSpreadsheet,
    title: "22. Ekspor Excel & CSV",
    desc: "Selain CSV, kamu bisa ekspor ke Excel (XLSX) dengan lebar kolom otomatis. Data file upload juga ikut diekspor lengkap dengan link download-nya.",
  },
  {
    icon: UserCheck,
    title: "23. Halaman Error Login Ramah",
    desc: "Jika login Google bermasalah, kamu diarahkan ke halaman error berbahasa Indonesia dengan opsi alternatif: login email/password atau lanjut tanpa login.",
  },
];


export default function Guide() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link to="/" className="text-sm font-bold text-gradient">FormGua</Link>
          <nav className="hidden sm:flex items-center gap-1 text-xs">
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/">Beranda</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/panduan">Panduan</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/faq">FAQ</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/tentang">Tentang</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/pilih-mode">Mulai</Link>
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
              <Link to="/pilih-mode">
                Mulai
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Panduan Lengkap (Update Terbaru)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Cara Memakai <span className="text-gradient">FormGua</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Pelajari semua fitur FormGua mulai dari pemilihan mode (Login/Tamu), pembuatan form, kuis dengan timer, kustomisasi tema, hingga giveaway — semuanya dalam satu panduan praktis.
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base sm:text-lg leading-snug pt-1">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{step.desc}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Tips Pro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <UserCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p><strong>Pakai Mode Login</strong> kalau kamu serius mengelola banyak form. Lebih aman, tidak perlu hafal password per form.</p>
              </div>
              <div className="flex gap-3">
                <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p><strong>Selalu preview form</strong> sebelum dibagikan. Klik ikon 'Buka' untuk melihat tampilan publik form kamu.</p>
              </div>
              <div className="flex gap-3">
                <Timer className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p><strong>Untuk kuis</strong>, set timer realistis (misal 1 menit per soal pilihan ganda). Beri tahu peserta sebelum mulai.</p>
              </div>
              <div className="flex gap-3">
                <Gift className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p><strong>Untuk giveaway</strong>, pastikan minta nomor HP & e-wallet di form agar pemenang bisa langsung dihubungi via WhatsApp.</p>
              </div>
              <div className="flex gap-3">
                <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p><strong>Cek analitik realtime</strong> di Dashboard — chart 'Respons Minggu Ini' update otomatis saat ada submit baru.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* FAQ teaser → halaman terpisah */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-8 text-center space-y-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Punya pertanyaan?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Lihat daftar lengkap pertanyaan umum tentang mode login, kuis, anti-cheat, giveaway, dan lainnya di halaman FAQ.
            </p>
            <Button asChild className="gap-2 mt-2">
              <Link to="/faq">
                Buka Halaman FAQ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-primary/20">
          <CardContent className="py-10 sm:py-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Siap Membuat Form Pertamamu?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
              Pilih mode Login (privat & aman) atau Tamu (publik & cepat) — kamu yang putuskan.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/pilih-mode">
                Pilih Mode & Mulai
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
