# ALHUDA MOBILE — Panduan Pemasangan

Aplikasi manajemen administrasi & akademik YPI Dayah Al-Huda Malikussaleh.
Semua data tersimpan di **Google Sheets**. Aplikasi membaca dan menulis langsung ke sheet melalui **Google Apps Script**, jadi perubahan di sheet langsung tampil di aplikasi, dan sebaliknya.

```
alhuda/
├── apps-script/        ← kode server + tampilan aplikasi (ditempel ke Google Apps Script)
│   ├── Code.gs         ← backend: database Sheets, login, hak akses, PDF
│   ├── Seed.gs         ← data awal 292 santri + 4 guru
│   ├── Index.html      ← tampilan aplikasi (login, 5 menu bawah, chat, tema)
│   └── appsscript.json ← pengaturan proyek
├── android/            ← proyek Android Studio (membungkus web app menjadi APK)
├── Daftar_Akun_Awal.csv← username & password awal semua pengguna
└── PANDUAN.md
```

---

## Langkah 1 — Buat Google Sheet + Apps Script

1. Buka **sheets.google.com**, lalu buat spreadsheet baru dengan nama `DATABASE ALHUDA MOBILE`.
2. Pilih menu **Ekstensi → Apps Script**.
3. Di editor Apps Script:
   - Ganti isi `Code.gs` dengan isi file **apps-script/Code.gs**.
   - Klik **＋ → Skrip**, beri nama `Seed`, lalu tempel isi **Seed.gs**.
   - Klik **＋ → HTML**, beri nama `Index` (tanpa .html), lalu tempel isi **Index.html**.
   - Buka **Setelan proyek (ikon gerigi)**, centang *Tampilkan file manifes "appsscript.json"*, lalu ganti isinya dengan **appsscript.json**.
4. Pilih fungsi **`setupAwal`** di bilah atas, lalu klik **Jalankan**. Izinkan akses saat diminta (Lanjutan → Buka proyek).
   Langkah ini membuat 16 sheet, 17 kelas, 5 sesi, pengaturan, dan **296 akun**.

## Langkah 2 — Deploy sebagai Web App

1. Klik **Terapkan → Deployment baru → Jenis: Aplikasi web**.
2. Isi **Jalankan sebagai: Saya** dan **Yang memiliki akses: Siapa saja**.
3. Klik **Terapkan**, lalu salin **URL Web App** (berakhiran `/exec`).
4. Buka URL tersebut di HP. Aplikasi sudah bisa dipakai lewat browser.

> Setiap kali kode diubah: **Terapkan → Kelola deployment → Edit (pensil) → Versi: Versi baru → Terapkan**. URL tidak berubah.

## Langkah 3 — Buat APK Android

### Cara A — Tanpa Android Studio (lewat GitHub, gratis)
1. Buat akun di **github.com**, lalu buat repository baru (misalnya `alhuda-mobile`, boleh *Private*).
2. Buka file `android/app/src/main/res/values/strings.xml`, lalu ganti `GANTI_DENGAN_ID_DEPLOYMENT…` dengan URL Web App dari Langkah 2.
3. Unggah **seluruh isi folder `alhuda/`** ke repository. Folder tersembunyi `.github` harus ikut terunggah. Caranya: di halaman repo pilih **Add file → Upload files**, lalu seret semua isi folder.
4. Buka tab **Actions** di repo. Proses "Build APK ALHUDA MOBILE" berjalan otomatis selama ±5 menit.
5. Setelah selesai (tanda centang hijau), klik proses tersebut. Di bagian **Artifacts**, unduh **ALHUDA-MOBILE-APK**, lalu ekstrak zip-nya untuk mendapatkan `ALHUDA-MOBILE.apk`.
6. Kirim APK ke HP dan pasang. Izinkan *Instal dari sumber tidak dikenal* bila diminta.

Setiap kali ada perubahan pada folder `android/` yang diunggah ke repo, APK baru dibuat otomatis. Kode di `apps-script/` **tidak** memerlukan APK baru: cukup deploy versi baru di Apps Script.

### Cara B — Dengan Android Studio

1. Pasang **Android Studio**, lalu buka folder `android/`.
2. Buka `app/src/main/res/values/strings.xml`, lalu ganti `web_app_url` dengan URL dari Langkah 2.
3. (Opsional) Ganti ikon: **File → New → Image Asset**, lalu pilih logo dayah.
4. Pilih **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. File APK ada di `app/build/outputs/apk/`.
   Untuk dibagikan, sebaiknya pakai **Build → Generate Signed Bundle / APK**.

APK menambahkan fitur bawaan HP: notifikasi chat (juga saat aplikasi ditutup, diperiksa ±15 menit sekali), tombol kembali, unggah foto profil, serta membuka/membagikan PDF.

---

## Logo pesantren
Unggah logo ke Google Drive, lalu buka **Bagikan → Siapa saja yang memiliki link**. Salin link atau ID file ke sheet **Pengaturan**:
- `logo_dayah`: logo di halaman login, kop raport Salafi, dan laporan keuangan
- `logo_wustha`, `logo_ulya`: logo pada kop raport PDF Wustha dan PDF Ulya

## Akun
- Username = nama depan (gelar seperti *Tgk.* dan inisial *M.* / *T.* dilewati), huruf kecil. Password = `namadepan123`.
- Jika ada nama depan yang sama, username diberi angka: `muhammad`, `muhammad2`, …. Password tetap `muhammad123`. Lihat **Daftar_Akun_Awal.csv**.
- Password yang diketik admin di sheet **Users** otomatis dienkripsi saat pengguna pertama kali login. Untuk mereset, ketik password baru di kolom `password`.
- Isi `Tidak` di kolom `aktif` untuk menonaktifkan akun.

## Hak akses
| Fitur | Yang boleh mengubah |
|---|---|
| Semua fitur, hapus data, nominal iuran/uang tahunan | Pengembang Aplikasi |
| Tambah/edit santri, guru, dan semua data | Admin |
| Roster pelajaran | Kabag Pendidikan, Kabag Administrasi |
| Absen santri | Guru yang mengajar di kelas & sesi tersebut (+ Kabag Pendidikan) |
| Absen jamaah | Kabag Jamaah |
| Absen guru, daftar mengulang malam | Kabag Pendidikan |
| Izin keluar sebentar | Kabag Humas |
| Perizinan pulang | Kabag Perizinan |
| Iuran, uang tahunan, saldo | Kabag Bendahara |
| Pengumuman | Kabag Media / Pendidikan / Humas |
| Nilai | Guru pengajar mapel di kelas itu, Kabag Pendidikan |
| Status naik kelas (semester 2) | Wali kelas, Kabag Pendidikan |

Santri hanya bisa melihat absensi, nilai, iuran, dan saldo miliknya sendiri. Isi Room Chat hanya bisa dilihat oleh pengirim dan penerima. Admin dan pengembang pun tidak bisa membacanya dari aplikasi.

**Wali kelas** ditentukan otomatis: guru yang mengajar sesi bertanda `wali_kelas = Ya` di sheet **Sesi** (19.30–22.00).

## Mengubah data langsung di Sheets
Semua sheet bisa diedit langsung, misalnya menambah kelas di sheet **Kelas** (kolom `jenjang`: Wustha / Ulya / Salafi) atau mengubah jam sesi di sheet **Sesi**. Jangan mengubah nama kolom pada baris pertama.
Tahun ajaran dan semester aktif diatur di sheet **Pengaturan** atau di menu **Pengaturan → Pengaturan Aplikasi**.
