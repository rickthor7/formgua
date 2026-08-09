import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Wrench, Zap, Palette, ShieldCheck, Rocket, FileText, Wand2, BarChart3, Search, Gift, Layers, Crown, MessageSquare, GraduationCap, Timer, Link2, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type EntryTag = "Baru" | "Peningkatan" | "Perbaikan" | "Desain";

interface Entry {
  version: string;
  date: string;
  title: string;
  icon: typeof Sparkles;
  color: string;
  items: { tag: EntryTag; icon: typeof Sparkles; text: string }[];
}

const TAG_STYLE: Record<EntryTag, string> = {
  Baru: "bg-[hsl(var(--g-blue))]/10 text-[hsl(var(--g-blue))] border-[hsl(var(--g-blue))]/30",
  Peningkatan: "bg-[hsl(var(--g-green))]/10 text-[hsl(var(--g-green))] border-[hsl(var(--g-green))]/30",
  Perbaikan: "bg-[hsl(var(--g-yellow))]/15 text-amber-700 dark:text-amber-400 border-[hsl(var(--g-yellow))]/40",
  Desain: "bg-[hsl(var(--g-red))]/10 text-[hsl(var(--g-red))] border-[hsl(var(--g-red))]/30",
};

const entries: Entry[] = [
  {
    version: "v2.0.1",
    date: "9 Agustus 2026",
    title: "Tur Onboarding Lebih Akurat",
    icon: CheckCircle2,
    color: "text-[hsl(var(--g-green))]",
    items: [
      { tag: "Perbaikan", icon: CheckCircle2, text: "Sorotan tur kini menunjuk elemen yang benar: tombol Edit (tema, banner, password, timer), tombol Respons (Spin Wheel & Leaderboard), dan menu Analisis AI di sidebar." },
      { tag: "Peningkatan", icon: Wand2, text: "Deskripsi tiap langkah ditulis ulang sesuai fitur nyata, ditambah langkah baru untuk grafik & statistik realtime (total 5 langkah)." },
      { tag: "Peningkatan", icon: Rocket, text: "Setiap langkah punya target cadangan, jadi tur tetap jalan mulus di Mode Tamu atau saat menu tertentu tidak tampil." },
    ],
  },
  {
    version: "v2.0",
    date: "9 Agustus 2026",
    title: "Tur Interaktif Onboarding di Dashboard",
    icon: Rocket,
    color: "text-[hsl(var(--g-green))]",
    items: [
      { tag: "Baru", icon: Rocket, text: "Tur panduan muncul otomatis saat pertama kali membuka Dashboard — berlaku untuk pengguna login maupun Mode Tamu." },
      { tag: "Baru", icon: Wand2, text: "Popover elegan dengan spotlight, panah penunjuk, badge \"Langkah X dari Y\", serta tombol Lanjut / Sebelumnya / Lewati Tur." },
      { tag: "Peningkatan", icon: CheckCircle2, text: "Status tur disimpan di perangkat agar hanya tampil sekali; bisa diulang kapan saja lewat tombol tanda tanya di header Dashboard." },
    ],
  },

  {

    version: "v1.9",
    date: "23 Juli 2026",
    title: "Kuis Mode Quizizz — Kode Join, QR & Leaderboard Realtime",
    icon: GraduationCap,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Baru", icon: GraduationCap, text: "Setiap form kuis otomatis dapat kode 6 digit + QR code untuk dibagikan. Peserta tinggal scan atau input kode di halaman /kuis — tidak perlu link panjang." },
      { tag: "Baru", icon: Sparkles, text: "Sebelum mulai kuis, peserta memasukkan nama dulu. Nama ini muncul di leaderboard." },
      { tag: "Baru", icon: Zap, text: "Leaderboard realtime muncul otomatis setelah kuis selesai — rank & skor peserta terupdate live untuk semua yang menyelesaikan." },
      { tag: "Peningkatan", icon: Link2, text: "Halaman gabung kuis (/kuis) tersedia di navbar landing page." },
    ],
  },
  {
    version: "v1.8.3",
    date: "22 Juli 2026",
    title: "Pembahasan AI & Download PDF Hasil Ujian",
    icon: GraduationCap,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Peningkatan", icon: Wand2, text: "Generate AI untuk form kuis/ujian sekarang otomatis mengisi pembahasan tiap soal, jadi siswa punya penjelasan siap pakai." },
      { tag: "Baru", icon: FileText, text: "Responden bisa download hasil ujian (pertanyaan, jawaban, kunci, dan pembahasan) dalam bentuk PDF untuk bahan belajar." },
    ],
  },
  {
    version: "v1.8.2",
    date: "22 Juli 2026",
    title: "Nilai per Soal & Pembahasan Kuis",
    icon: GraduationCap,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Baru", icon: GraduationCap, text: "Setiap soal kuis kini menampilkan badge nilai (poin) di samping pertanyaan, jadi responden tahu bobot tiap soal." },
      { tag: "Baru", icon: Sparkles, text: "Author bisa mengisi pembahasan/penjelasan per soal. Otomatis muncul di detail hasil kuis untuk soal yang dijawab salah, biar responden bisa belajar." },
      { tag: "Peningkatan", icon: CheckCircle2, text: "Rincian hasil kuis menampilkan poin diperoleh vs poin maksimal per soal." },
    ],
  },
  {
    version: "v1.8.1",
    date: "21 Juli 2026",
    title: "Variasi Hadiah Giveaway Lebih Lebar",
    icon: Gift,
    color: "text-[hsl(var(--g-yellow))]",
    items: [
      { tag: "Peningkatan", icon: Gift, text: "Mode acak sekarang membagi hadiah dengan variasi lebih lebar (0.3x-2.2x rata-rata) supaya nominal antar pemenang terasa beda." },
    ],
  },
  {
    version: "v1.8",
    date: "21 Juli 2026",
    title: "Ekspor Hasil Analisis AI ke Excel & Word",
    icon: FileText,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Baru", icon: FileText, text: "Tombol download hasil analisis AI dalam format Excel (.xlsx) dengan sheet ringkasan, metrik, deskriptif, dan korelasi." },
      { tag: "Baru", icon: FileText, text: "Tombol download hasil analisis AI dalam format Word (.docx) siap dilampirkan ke laporan/skripsi." },
    ],
  },
  {
    version: "v1.7",
    date: "17 Juli 2026",
    title: "Halaman Terima Kasih yang Bisa Dikustom",
    icon: CheckCircle2,
    color: "text-[hsl(var(--g-green))]",
    items: [
      { tag: "Baru", icon: MessageSquare, text: "Pemilik form kini bisa menulis pesan terima kasih sendiri yang tampil setelah responden submit." },
      { tag: "Baru", icon: Link2, text: "Tambah hingga 5 tombol link (mis. WhatsApp, Instagram, website) di halaman setelah submit." },
      { tag: "Peningkatan", icon: Sparkles, text: "Halaman selesai form mendukung teks multi-baris dan tampilan tombol link yang rapi." },
    ],
  },
  {
    version: "v1.6",
    date: "16 Juli 2026",
    title: "SEO, AI Search & Prompt Contoh",
    icon: Search,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Baru", icon: Search, text: "Sitemap.xml, robots.txt, dan llms.txt untuk memudahkan Google & mesin pencari AI (GPTBot, Perplexity, Claude)." },
      { tag: "Peningkatan", icon: FileText, text: "Structured data JSON-LD (WebSite & SoftwareApplication) ditambahkan ke halaman utama." },
      { tag: "Peningkatan", icon: Wand2, text: "6 contoh prompt siap pakai di halaman AI Analisis (korelasi, deskriptif, t-test, regresi, dst)." },
      { tag: "Desain", icon: Layers, text: "Tata letak tombol prompt dirapikan jadi grid 2 kolom." },
    ],
  },
  {
    version: "v1.5",
    date: "15 Juli 2026",
    title: "Tema Google Material & Tabel Statistik",
    icon: Palette,
    color: "text-[hsl(var(--g-red))]",
    items: [
      { tag: "Desain", icon: Palette, text: "Palet warna beralih ke tema Google Material (biru, merah, kuning, hijau) dengan font Roboto." },
      { tag: "Baru", icon: BarChart3, text: "Hasil AI Analisis kini menampilkan tabel statistik deskriptif & korelasi Pearson terkomputasi." },
      { tag: "Perbaikan", icon: Wrench, text: "Fix bug hasil analisis yang menampilkan ID variabel; sekarang tampil nama field asli." },
      { tag: "Desain", icon: Sparkles, text: "Landing page dipercantik dengan hero glassmorphism, stats band, dan CTA premium." },
    ],
  },
  {
    version: "v1.4",
    date: "12 Juli 2026",
    title: "AI Analisis Data untuk Premium",
    icon: Wand2,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Baru", icon: Wand2, text: "Fitur AI Analisis Data khusus Premium: uji korelasi, deskriptif, regresi dari dataset form." },
      { tag: "Baru", icon: FileText, text: "Rendering Markdown lengkap dengan formula matematika untuk hasil AI." },
      { tag: "Peningkatan", icon: Layers, text: "Navigasi dashboard dirapikan pakai komponen shadcn/Radix." },
    ],
  },
  {
    version: "v1.3",
    date: "8 Juli 2026",
    title: "Harga Premium Lebih Terjangkau",
    icon: Crown,
    color: "text-[hsl(var(--g-yellow))]",
    items: [
      { tag: "Peningkatan", icon: Crown, text: "Harga Premium diturunkan: Rp5rb/minggu, Rp10rb/bulan, Rp25rb/tahun." },
      { tag: "Perbaikan", icon: Wrench, text: "Perpindahan halaman tidak lagi 'nyangkut' di posisi scroll sebelumnya — selalu scroll ke atas." },
      { tag: "Desain", icon: Layers, text: "Halaman Verifikasi, Invoice, dan Chat admin dipindahkan ke navbar agar area kerja lebih luas." },
    ],
  },
  {
    version: "v1.2",
    date: "1 Juli 2026",
    title: "Chat Admin & Notifikasi Email",
    icon: MessageSquare,
    color: "text-[hsl(var(--g-green))]",
    items: [
      { tag: "Baru", icon: MessageSquare, text: "Chat langsung ke admin untuk bantuan, upgrade premium, dan pertanyaan umum." },
      { tag: "Baru", icon: Rocket, text: "Notifikasi email otomatis setiap ada respons form baru masuk." },
      { tag: "Baru", icon: ShieldCheck, text: "Sistem verifikasi bukti pembayaran Premium via bank/e-wallet." },
    ],
  },
  {
    version: "v1.1",
    date: "20 Juni 2026",
    title: "Form Kuis & Anti-Cheat",
    icon: GraduationCap,
    color: "text-[hsl(var(--g-blue))]",
    items: [
      { tag: "Baru", icon: GraduationCap, text: "Mode Form Kuis dengan kunci jawaban dan skor otomatis (pilihan ganda A–E + isian teks)." },
      { tag: "Baru", icon: Timer, text: "Timer batas waktu kuis dengan peringatan 10 detik & auto-submit saat habis." },
      { tag: "Baru", icon: ShieldCheck, text: "Anti-cheat: blokir klik kanan/copy-paste, deteksi pindah tab & PrintScreen, log aktivitas mencurigakan." },
      { tag: "Baru", icon: Gift, text: "Giveaway saldo e-wallet (DANA/OVO/GoPay) — mode bagi rata atau nominal acak dengan spin wheel." },
    ],
  },
  {
    version: "v1.0",
    date: "1 Juni 2026",
    title: "Rilis Awal FormGua",
    icon: Rocket,
    color: "text-[hsl(var(--g-red))]",
    items: [
      { tag: "Baru", icon: FileText, text: "Form Builder drag & drop dengan berbagai tipe field (teks, pilihan ganda, likert, upload file, tanggal, dsb)." },
      { tag: "Baru", icon: Layers, text: "Dua mode tampilan: per-halaman (Typeform-style) & scroll penuh (Google Form-style)." },
      { tag: "Baru", icon: Palette, text: "Kustomisasi tema warna aksen & gaya tombol per form." },
      { tag: "Baru", icon: BarChart3, text: "Dashboard analitik dengan chart respons dan ringkasan statistik dasar." },
      { tag: "Baru", icon: ShieldCheck, text: "Login email/password, Google OAuth, atau lanjut sebagai tamu dengan password per form." },
      { tag: "Baru", icon: Zap, text: "Ekspor respons ke CSV & Excel (XLSX) dengan lebar kolom otomatis." },
    ],
  },
];

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
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
            <Link to="/tentang" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Tentang
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary mb-3">
            <Sparkles className="h-3 w-3" />
            Changelog
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Riwayat Pembaruan <span className="text-gradient">FormGua</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Semua rilis, fitur baru, peningkatan, dan perbaikan sejak FormGua pertama kali diluncurkan.
          </p>
          <div className="mt-4 h-1 w-40 mx-auto rounded-full google-stripe opacity-80" />
        </motion.div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 sm:left-6 top-2 bottom-2 w-px bg-border" aria-hidden />

          <div className="space-y-6">
            {entries.map((entry, idx) => {
              const Icon = entry.icon;
              return (
                <motion.article
                  key={entry.version}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className="relative pl-12 sm:pl-16"
                >
                  <div className="absolute left-0 top-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${entry.color}`} />
                  </div>

                  <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-bold tracking-wide">
                        {entry.version}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{entry.date}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold leading-tight">{entry.title}</h2>

                    <ul className="mt-3 space-y-2">
                      {entry.items.map((item, i) => {
                        const ItemIcon = item.icon;
                        return (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className={`shrink-0 mt-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${TAG_STYLE[item.tag]}`}>
                              <ItemIcon className="h-2.5 w-2.5" />
                              {item.tag}
                            </span>
                            <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground">
          Punya masukan atau nemu bug? <Link to="/tentang" className="text-primary hover:underline font-medium">Hubungi kami</Link>.
        </div>
      </main>
    </div>
  );
}
