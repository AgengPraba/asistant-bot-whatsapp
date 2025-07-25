# Bot Asisten WhatsApp Pribadi & Komunitas

Bot WhatsApp multifungsi yang dibangun dengan **Node.js**, **TypeScript**, **Prisma**, dan **Baileys**. Dirancang sebagai asisten pribadi untuk mahasiswa dan juga dilengkapi dengan fitur manajemen komunitas untuk grup spesifik.

## 🪟 Preview
<div align="center">
   <img alt="preview-pov-bot" src="./assets/pov-bot.gif" width="300" />&nbsp;&nbsp;&nbsp;&nbsp;
   <img alt="preview-pov-bot" src="./assets/pov-client.gif" width="300" />
</div>

---

## ✨ Fitur Utama

Bot ini dilengkapi dengan berbagai fitur untuk meningkatkan produktivitas dan mengelola komunitas:

### 🧑‍💻 Asisten Pribadi
* **Konverter Dokumen**:
    * Word (`.docx`, `.doc`) ke PDF
    * Gambar (`.jpg`, `.png`) ke PDF
    * Menggabungkan beberapa file PDF menjadi satu.
* **Downloader Media**:
    * Mengunduh audio (`.mp3`) atau video (`.mp4`) dari YouTube, TikTok, dan situs lain yang didukung `yt-dlp`.
* **Pengingat Pribadi**:
    * Mengatur pengingat untuk tugas, jadwal, atau acara penting dengan pemrosesan waktu bahasa natural (contoh: "besok jam 10 pagi").

### 🏠 Manajemen Komunitas
* **CRUD Tagihan**: Fitur lengkap untuk mengelola tagihan (misalnya: iuran listrik kos) khusus untuk grup tertentu.
* **Manajemen Anggota**: Menambah dan mengeluarkan anggota grup melalui perintah (membutuhkan hak admin).
* **Moderasi Otomatis**: Menghapus pesan yang mengandung kata-kata terlarang secara otomatis.

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum instalasi, pastikan semua perangkat lunak berikut sudah terpasang di sistem (komputer/server) Anda:

* [**Node.js**](https://nodejs.org/) (v18 atau lebih baru)
* [**Docker**](https://www.docker.com/products/docker-desktop/) (Diperlukan untuk menjalankan Gotenberg)
* [**FFmpeg**](https://ffmpeg.org/download.html) (Diperlukan oleh `yt-dlp` untuk memproses media)
* [**yt-dlp**](https://github.com/yt-dlp/yt-dlp) (Diperlukan untuk fitur downloader)

---

## ⚙️ Instalasi & Konfigurasi

Ikuti langkah-langkah berikut untuk menjalankan bot di lingkungan lokal Anda.

**1. Clone Repositori**
```bash
git clone https://github.com/AgengPraba/assistant-bot-whatsapp
cd assistant-bot-whatsapp
```

**2. Instal Dependensi Proyek**
```bash
npm install
```

**3. Buat Folder Uploads dan Downloads**
```bash
mkdir uploads downloads
```

**4. Konfigurasi Environment**
Salin file `.env.example` menjadi `.env` dan isi semua variabel yang dibutuhkan.
```bash
cp .env.example .env
```
Isi file `.env`:
```env
# URL untuk koneksi database Prisma (default menggunakan SQLite)
DATABASE_URL="file:./dev.db"
```

**5. Konfigurasi Aplikasi (`config/index.ts`)**
Salin file contoh dan isi konfigurasinya. File ini berisi konfigurasi yang tidak rahasia.
```bash
cp src/config/index.ts.example src/config/index.ts
```
Buka file `src/config/index.ts` dan sesuaikan isinya:
```typescript
// ID Grup WhatsApp untuk fitur tagihan
export const GRUP_ID_LISTRIK = "6285212345678-1590634905@g.us"

// Nomor admin (format JID: 62...s.whatsapp.net), bisa lebih dari satu dipisah koma
ADMIN_NUMBER="6281234567890@s.whatsapp.net,6289876543210@s.whatsapp.net"

// Daftar kata-kata yang akan dihapus otomatis oleh bot
export const FORBIDDEN_WORDS = ['anjing', 'ajg', 'asw'];
```

**6. Jalankan Migrasi Database**
Perintah ini akan membuat database SQLite dan tabel yang diperlukan berdasarkan skema Prisma.
```bash
npx prisma migrate dev
```

**7. Jalankan Gotenberg via Docker**
Buka terminal baru (biarkan tetap berjalan) dan jalankan perintah ini untuk mengaktifkan layanan konverter dokumen.
```bash
docker run --rm -p 3000:3000 gotenberg/gotenberg:8
```

---

## 🚀 Menjalankan Bot

Setelah semua konfigurasi selesai, jalankan bot dengan perintah:
```bash
npm run dev
```
Pada saat pertama kali dijalankan, sebuah QR code akan muncul di terminal. Pindai (scan) kode tersebut menggunakan aplikasi WhatsApp di ponsel Anda (dari menu **Perangkat Tertaut**).

---

## 📖 Daftar Perintah

Berikut adalah daftar perintah yang tersedia:

### Perintah Umum
| Perintah | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `.ping` | Mengecek apakah bot aktif (hanya di chat pribadi). | `.ping` |
| `.info` | Menampilkan ID grup saat ini (hanya di grup). | `.info` |

### Perintah Konverter (Asisten Pribadi)
| Perintah | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `.word2pdf` | Mengubah file Word menjadi PDF. Kirim file `.docx` dengan caption ini. | `(kirim file.docx)` `.word2pdf` |
| `.img2pdf` | Mengubah gambar menjadi PDF. Kirim gambar dengan caption ini. | `(kirim gambar.jpg)` `.img2pdf` |
| `.mulai-gabung`| Memulai sesi untuk menggabungkan PDF. | `.mulai-gabung` |
| `.gabungpdf` | Memproses semua PDF yang telah dikirim dalam sesi. | `.gabungpdf` |
| `.batal-gabung`| Membatalkan sesi dan menghapus semua file. | `.batal-gabung` |

### Perintah Downloader (Asisten Pribadi)
| Perintah | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `.mp3 <url>`| Mengunduh audio dari link YouTube/Facebook/dll. | `.mp3 https://youtu.be/jNQXAC9IVRw?si=Gt5AJBFCKdh-Yjwt` |
| `.mp4 <url>`| Mengunduh video dari link YouTube/Facebook/dl. | `.mp4 https://youtu.be/jNQXAC9IVRw?si=Gt5AJBFCKdh-Yjwt` |

### Perintah Reminder (Asisten Pribadi)
| Perintah | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `.ingatin "pesan" <waktu>` | Mengatur pengingat pribadi. | `.ingatin "Kumpul tugas" besok 10:00` |

### Perintah Admin Grup (Wajib Admin)
| Perintah | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `.add <nomor>` | Menambah anggota ke grup. | `.add 6281234567890` |
| `.kick @user` | Mengeluarkan anggota dari grup. | `.kick @Pengguna` |

---

## 📂 Struktur Proyek

```
/
├── prisma/         # Skema dan migrasi database
├── src/
│   ├── api/        # Jembatan ke API eksternal (Gotenberg)
│   ├── config/     # File konfigurasi (ID grup, kata terlarang)
│   ├── handlers/   # Logika untuk menangani setiap perintah/fitur
│   ├── services/   # Logika inti (konversi, download, penjadwalan)
│   └── app.ts      # Titik masuk utama & router aplikasi
├── .env            # File environment (kunci API, ID admin)
└── README.md       # Dokumentasi ini
```

---

## 🤝 Kontribusi

Kontribusi, isu, dan permintaan fitur sangat diterima. Jangan ragu untuk membuat *pull request*.

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.
