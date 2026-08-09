# 📝 MyFormGua - AI-Powered Form & Quiz Builder

**MyFormGua** adalah platform pembuat formulir dan kuis interaktif berbasis *Single Page Application* (SPA) modern yang ditenagai oleh Kecerdasan Buatan (AI) dan ekosistem *Backend-as-a-Service* (BaaS) dari Supabase. 

Dengan MyFormGua, pengguna dapat membuat formulir kompleks hanya dengan *prompt* teks biasa, mengumpulkan respons secara *real-time*, melakukan analisis data otomatis berbasis AI, serta menikmati fitur gamifikasi interaktif seperti *Quiz Leaderboard* dan *Giveaway Spin Wheel*.

---

## ✨ Fitur Utama

### 🤖 AI-Powered Features
* **AI Form Generator**: Buat formulir/kuis secara otomatis hanya dengan memasukkan deskripsi atau *prompt* teks.
* **AI Data Summarization**: Menganalisis dan merangkum ratusan jawaban responden secara otomatis menjadi wawasan visual yang siap pakai.

### 📋 Form & Quiz Engine
* **Custom Form Builder**: Penyunting formulir modular dengan berbagai opsi input (*multiple choice*, *short text*, *paragraph*, *file upload*, dll.).
* **Quiz Mode & Timer**: Dukungan pembuatan kuis interaktif lengkap dengan kunci jawaban, penilaian otomatis, dan batas waktu pengerjaan.
* **Form Protection**: Fitur proteksi kata sandi, pembatasan jumlah respons, dan jadwal penutupan formulir otomatis.

### 🎮 Gamifikasi & Interaktivitas
* **Quiz Leaderboard**: Papan peringkat otomatis berdasarkan skor dan kecepatan pengerjaan kuis.
* **Giveaway Spin Wheel**: Roda keberuntungan untuk mengundi pemenang *giveaway* secara transparan dari data responden.

### 🛡️ Keamanan & Performa
* **Real-time Updates**: Dasbor memperbarui statistik jawaban secara instan tanpa *refresh* halaman menggunakan Supabase Realtime.
* **Row-Level Security (RLS)**: Proteksi data tingkat baris di PostgreSQL untuk menjamin privasi data antar pengguna.
* **Dynamic Open Graph Image**: Pratinjau gambar dinamis saat tautan formulir dibagikan ke media sosial.

---

## 🛠️ Tech Stack

### Frontend
* **Core Framework**: React 18
* **Build Tool**: Vite
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: Shadcn/UI & Radix UI

### Backend & Database (Supabase)
* **Database**: PostgreSQL (dengan Row Level Security)
* **Authentication**: Supabase Auth (JWT)
* **Realtime**: Supabase Realtime (WebSockets)
* **Storage**: Supabase Storage
* **Serverless**: Supabase Edge Functions (Deno/TypeScript)

---

## 🚀 Cara Menjalankan Proyek di Lokal

### Prasyarat
Pastikan Anda telah menginstal software berikut di komputer Anda:
* [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
* [npm](https://www.npmjs.com/) atau [pnpm](https://pnpm.io/)
* Akun [Supabase](https://supabase.com/)

### Langkah Instalasi

1. **Clone Repositori**
   ```bash
   git clone [https://github.com/username-anda/myformgua.git](https://github.com/username-anda/myformgua.git)
   cd myformgua

Instal Dependensi

Bash
npm install
Pengaturan Variabel Lingkungan (.env)
Buat file .env pada direktori utama proyek dan tambahkan kredensial Supabase Anda:

Cuplikan kode
VITE_SUPABASE_URL=[https://project-id-anda.supabase.co](https://project-id-anda.supabase.co)
VITE_SUPABASE_ANON_KEY=your-anon-key-here
Jalankan Development Server

Bash
npm run dev
Buka peramban dan akses alamat http://localhost:5173.

🏗️ Struktur Arsitektur Singkat
┌──────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│             React 18 + Vite + TypeScript                 │
└────────────────────────────┬─────────────────────────────┘
                             │ REST / WebSocket / Edge Calls
┌────────────────────────────▼─────────────────────────────┐
│                 BaaS & Serverless Layer                  │
│                        (Supabase)                        │
│ ┌──────────────┐   ┌──────────────┐   ┌────────────────┐ │
│ │ PostgreSQL   │   │Supabase Auth │   │Supabase Storage│ │
│ └──────────────┘   └──────────────┘   └────────────────┘ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │  Edge Functions (generate-form-ai, analyze-data-ai)  │ │
│ └──────────────────────────┬───────────────────────────┘ │
└────────────────────────────┼─────────────────────────────┘
                             │ External API Calls
┌────────────────────────────▼─────────────────────────────┐
│               External Integrations Layer                │
│                 AI Provider (OpenAI / LLM)               │
└──────────────────────────────────────────────────────────┘
📄 Lisensi
Proyek ini dilisensikan di bawah lisensi MIT - lihat file LICENSE untuk detail selengkapnya.
