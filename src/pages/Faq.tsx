import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, HelpCircle, MessageCircle } from "lucide-react";

const faqs = [
  {
    q: "Apa bedanya Mode Login dan Mode Tamu?",
    a: "Mode Login: form jadi milik akunmu, hanya kamu yang bisa edit/hapus, tidak perlu password manual. Mode Tamu: form publik bisa dikelola siapa saja yang punya passwordnya. Pilih sesuai kebutuhan privasi.",
  },
  {
    q: "Apakah saya bisa pindah dari mode tamu ke mode login?",
    a: "Form yang sudah dibuat dengan mode tamu tetap di mode tamu (publik). Setelah login, kamu mulai dengan dashboard kosong dan form baru otomatis jadi milik akunmu. Form lama tetap bisa diakses via link.",
  },
  {
    q: "Apakah form bisa diedit setelah ada yang mengisi?",
    a: "Bisa, tapi sebaiknya hindari mengubah struktur pertanyaan yang sudah ada respons karena bisa membuat data lama tidak konsisten. Aman untuk menambah pertanyaan baru di akhir.",
  },
  {
    q: "Berapa maksimal pertanyaan dalam satu form?",
    a: "Tidak ada batas keras, tapi untuk pengalaman responden yang baik kami sarankan maksimal 20-30 pertanyaan per form.",
  },
  {
    q: "Apakah responden perlu login untuk mengisi form?",
    a: "Tidak perlu. Form bersifat publik dan bisa diisi siapa saja yang punya link, kecuali kamu mengaktifkan password gate.",
  },
  {
    q: "Bagaimana cara kerja kuis dengan timer?",
    a: "Atur batas waktu di header Form Builder (misal 30 menit). Saat responden mengisi, timer berjalan di pojok. Pada 30 detik terakhir muncul peringatan, dan saat habis form auto-submit dengan jawaban yang sudah terisi.",
  },
  {
    q: "Bagaimana sistem anti-cheat (anti-curang) di Form Kuis bekerja?",
    a: "Pada form Kuis, teks soal tidak bisa diseleksi/copy, klik kanan & shortcut copy/cut/print/save diblokir. Sistem juga mendeteksi saat responden berpindah tab, jendela kehilangan fokus, atau menekan PrintScreen. Setiap pelanggaran tercatat lengkap dengan waktu kejadiannya.",
  },
  {
    q: "Di mana saya bisa melihat siapa saja yang melakukan kecurangan?",
    a: "Buka halaman Respons pada form Kuis. Ada panel 'Aktivitas Mencurigakan' yang menampilkan daftar responden, jumlah pelanggaran, jenis pelanggaran, dan waktu detail tiap kejadian. Author juga mendapat notifikasi email berisi rangkuman pelanggaran.",
  },
  {
    q: "Apakah screenshot bisa diblokir 100%?",
    a: "Tidak. Browser tidak punya akses memblokir screenshot tingkat OS (Win+Shift+S, screenshot HP, dsb). Yang dapat dideteksi adalah tombol PrintScreen, perpindahan tab, dan hilangnya fokus jendela — yang sudah cukup efektif sebagai indikator kecurangan.",
  },
  {
    q: "Bagaimana cara kerja giveaway acak?",
    a: "Sistem akan membagi total hadiah secara acak dengan pembulatan kelipatan 500 rupiah. Misal hadiah 50.000 untuk 5 orang, bisa jadi 20.000, 12.500, 8.000, 5.500, 4.000.",
  },
  {
    q: "Bagaimana ekspor data respons?",
    a: "Di halaman Respons, klik 'Ekspor' lalu pilih CSV atau Excel (XLSX). Excel sudah otomatis mengatur lebar kolom agar mudah dibaca. Data file upload ikut diekspor dengan link download-nya.",
  },
  {
    q: "Bagaimana jika lupa password form (mode tamu)?",
    a: "Sayangnya password tidak bisa direset karena alasan keamanan. Solusi: gunakan Mode Login agar tidak perlu mengingat password lagi. Akses dilindungi akun Google atau email kamu.",
  },
  {
    q: "Apakah data form & jawaban saya aman? Bisa diintip orang lain?",
    a: "Sangat aman. Setiap data dikirim lewat HTTPS dengan enkripsi TLS 1.3 (tidak bisa disadap di WiFi publik manapun), lalu disimpan terenkripsi AES-256 di database. Form pribadimu juga dilindungi Row-Level Security — hanya akun pemilik yang bisa membacanya, ditegakkan langsung di level database, bukan sekadar di kode aplikasi. Kami tidak menjual data, tidak menampilkan iklan berdasarkan isi form, dan tidak membaca jawaban responden untuk profiling.",
  },
  {
    q: "Apakah admin FormGua bisa mengintip isi form atau jawaban responden saya?",
    a: "Tidak. Admin FormGua tidak punya pintu khusus untuk membaca isi form atau jawaban kamu. Akses ke tabel form dibatasi Row-Level Security di level database — query apapun yang bukan dari akun pemilik akan ditolak otomatis oleh PostgreSQL, termasuk dari panel admin. Dashboard admin yang ada hanya untuk verifikasi pembayaran Premium (cek bukti transfer & approve), bukan untuk membaca form. Tidak ada tombol 'lihat semua form' atau 'baca semua respons' — secara teknis memang tidak bisa kami buat tanpa membongkar arsitektur keamanan.",
  },
  {
    q: "Detail teknis enkripsinya bagaimana?",
    a: "1) In-transit: semua koneksi pakai TLS 1.3 dengan sertifikat dari otoritas terpercaya — data yang lewat antara browser kamu dan server kami tidak bisa dibaca penyadap (mis. WiFi cafe, ISP nakal). 2) At-rest: database dienkripsi penuh dengan AES-256, kunci dikelola oleh penyedia infrastruktur kami secara terpisah. 3) Authorization: setiap request divalidasi pakai JWT + Row-Level Security PostgreSQL — bahkan jika ada bug di kode aplikasi, database tetap menolak akses lintas-user. 4) Password form (mode tamu) di-hash, tidak disimpan plaintext.",
  },
  {
    q: "Kalau begitu, bagian mana yang BUKAN end-to-end encrypted?",
    a: "fitur opsional seperti notifikasi email author dan generate AI memang perlu memproses sebagian data di server (karena email harus dirender, dan AI butuh prompt). Tapi proses ini bersifat sementara, tidak disimpan di luar database utama, dan tidak diakses manusia. Jika kamu tidak mengaktifkan fitur tersebut, data form kamu tidak pernah diproses di luar penyimpanan terenkripsi.",
  },
  {
    q: "Bagaimana batasan fitur AI Generate?",
    a: "User non-login tidak bisa pakai AI. User terdaftar gratis dapat 3x pemakaian. Untuk pemakaian unlimited, upgrade ke Premium dengan verifikasi pembayaran oleh admin (maks 24 jam).",
  },
  {
    q: "Apakah FormGua benar-benar gratis?",
    a: "Iya, gratis selamanya untuk fitur inti — tanpa batas jumlah form maupun respons, tanpa watermark. Hanya generate AI yang punya kuota gratis 3x; untuk unlimited tersedia opsi Premium.",
  },
];

export default function Faq() {
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
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Pertanyaan Umum</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            FAQ <span className="text-gradient">FormGua</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Kumpulan pertanyaan yang paling sering ditanyakan — mulai dari mode login, kuis dengan timer, sistem anti-cheat, hingga giveaway.
          </p>
        </motion.div>
      </section>

      {/* FAQ list */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm sm:text-base">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Contact CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-6 sm:p-10 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Pertanyaanmu belum terjawab?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            DM langsung ke creator FormGua di Instagram, atau cek dulu panduan lengkapnya.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <a href="https://instagram.com/iam.rickthor7" target="_blank" rel="noopener noreferrer">
                Hubungi via Instagram
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/panduan">Baca Panduan</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-5 mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FormGua by rickthor7
        </div>
      </footer>
    </div>
  );
}
