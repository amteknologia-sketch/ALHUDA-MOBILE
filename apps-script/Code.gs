/**
 * ============================================================
 *  ALHUDA MOBILE — Backend Google Apps Script
 *  YPI Dayah Al-Huda Malikussaleh
 *  Seluruh data disimpan di Google Sheets (spreadsheet induk skrip ini).
 * ============================================================
 *  Cara pakai singkat:
 *   1. Jalankan fungsi  setupAwal  sekali (membuat semua sheet + akun awal).
 *   2. Deploy > New deployment > Web app
 *        Execute as : Me      Who has access : Anyone
 *   3. Salin URL Web App ke aplikasi Android (lihat PANDUAN.md).
 */

const TZ = 'Asia/Jakarta';
const APP_FOLDER = 'ALHUDA MOBILE - File';

/* ---------- Struktur sheet (kolom) ---------- */
const SHEETS = {
  Pengaturan: ['kunci', 'nilai', 'keterangan'],
  Users: ['username', 'password', 'nama', 'tipe', 'kabag', 'kelas', 'nis_nip', 'jenis_nomor', 'asal', 'foto',
          'asal_sekolah', 'kuliah', 'kampus', 'jurusan', 'tahun_masuk', 'kelas_masuk', 'aktif', 'dibuat',
          'wa', 'ig', 'nama_ortu', 'bio', 'galeri', 'privasi'],
  Kelas: ['nama', 'jenjang', 'urutan'],
  Sesi: ['kode', 'jam', 'berlaku', 'wali_kelas'],
  Roster: ['id', 'kelas', 'sesi', 'hari', 'mapel', 'guru', 'diubah_oleh', 'diubah'],
  Absensi: ['id', 'tanggal', 'jenis', 'sesi', 'kelas', 'mapel', 'username', 'status', 'keterangan', 'oleh', 'waktu'],
  IzinKeluar: ['id', 'tanggal', 'username', 'keperluan', 'jam_keluar', 'jam_kembali', 'status', 'oleh', 'waktu'],
  IzinPulang: ['id', 'username', 'tgl_pulang', 'tgl_kembali', 'alasan', 'status', 'oleh', 'waktu'],
  Mengulang: ['id', 'guru', 'santri', 'lokasi', 'diubah_oleh', 'diubah'],
  Nilai: ['id', 'username', 'kelas', 'tahun_ajaran', 'semester', 'mapel', 'nilai', 'oleh', 'waktu'],
  Raport: ['username', 'kelas', 'tahun_ajaran', 'semester', 'naik_kelas', 'catatan'],
  Iuran: ['id', 'username', 'tahun', 'bulan', 'jumlah', 'tanggal', 'oleh', 'keterangan'],
  UangTahunan: ['id', 'username', 'tahun_ajaran', 'jumlah', 'tanggal', 'oleh', 'keterangan'],
  Saldo: ['id', 'username', 'tanggal', 'jenis', 'jumlah', 'keterangan', 'oleh'],
  Pengumuman: ['id', 'tanggal', 'judul', 'isi', 'oleh', 'aktif'],
  Chat: ['id', 'dari', 'ke', 'pesan', 'waktu', 'dibaca'],
  Pelanggaran: ['id', 'tanggal', 'username', 'pelanggaran', 'sanksi', 'oleh', 'waktu']
};

const KABAG_LIST = ['Pengembang Aplikasi', 'Admin', 'Kabag Pendidikan', 'Kabag Administrasi', 'Kabag Bendahara',
  'Kabag Jamaah', 'Kabag Algojo', 'Kabag Kebersihan', 'Kabag Media', 'Kabag Humas', 'Kabag Asrama', 'Kabag Perizinan'];

const DEFAULT_SETTINGS = [
  ['nama_aplikasi', 'ALHUDA MOBILE', 'Nama aplikasi di header'],
  ['nama_yayasan', 'YPI DAYAH AL-HUDA MALIKUSSALEH', 'Tampil di halaman login'],
  ['nama_dayah', 'DAYAH AL-HUDA MALIKUSSALEH', 'Nama dayah (kop surat)'],
  ['alamat', 'Jln. Kampus Unimal Reuleut, Desa Muara Batu, Kab. Aceh Utara, Aceh', 'Alamat kop surat'],
  ['email', 'alhudamalikussalehdayah@gmail.com', 'Email kop surat'],
  ['logo_dayah', '', 'ID / link file Google Drive logo Dayah (login, kop Salafi & keuangan)'],
  ['logo_wustha', '', 'ID / link file Google Drive logo PDF Wustha'],
  ['logo_ulya', '', 'ID / link file Google Drive logo PDF Ulya'],
  ['iuran_salafi', '70000', 'Iuran bulanan santri Salafi (Rp)'],
  ['iuran_wustha', '60000', 'Iuran bulanan santri PDF Wustha (Rp)'],
  ['iuran_ulya', '60000', 'Iuran bulanan santri PDF Ulya (Rp)'],
  ['tahunan_salafi', '500000', 'Uang tahunan santri Salafi (Rp)'],
  ['tahunan_wustha', '550000', 'Uang tahunan santri PDF Wustha (Rp)'],
  ['tahunan_ulya', '560000', 'Uang tahunan santri PDF Ulya (Rp)'],
  ['iuran_mulai', '', 'Bulan awal penagihan iuran (format 2026-07). Kosong = Juli awal tahun ajaran'],
  ['tahun_ajaran', '2026/2027', 'Tahun ajaran aktif'],
  ['semester', '1', 'Semester aktif (1 / 2)'],
  ['kkm', '70', 'Nilai minimal tuntas'],
  ['kepala_wustha', 'Tgk. Mustawa, S.Pd', 'Ketua PDF Wustha'],
  ['jenis_no_kepala_wustha', 'NIP', 'Jenis nomor Ketua PDF Wustha (NIP / NIDN / NUPTK)'],
  ['nip_kepala_wustha', '-', 'Nomor Ketua PDF Wustha'],
  ['kepala_ulya', 'Tgk. Reza Nugraha, S.P., M.Pd', 'Ketua PDF Ulya'],
  ['jenis_no_kepala_ulya', 'NIP', 'Jenis nomor Ketua PDF Ulya (NIP / NIDN / NUPTK)'],
  ['nip_kepala_ulya', '-', 'Nomor Ketua PDF Ulya'],
  ['pimpinan_dayah', 'Abon Yahya Rasyiman', 'Pimpinan Dayah (raport Salafi)'],
  ['jenis_no_pimpinan', 'NIP', 'Jenis nomor Pimpinan Dayah (NIP / NIDN / NUPTK)'],
  ['nip_pimpinan', '-', 'Nomor Pimpinan Dayah'],
  ['bendahara', 'Tgk. Ihsan Maulidan', 'Bendahara Dayah (laporan keuangan)'],
  ['tentang_pemilik', 'Property Of DAMAS.Media_Centre @2026', ''],
  ['tentang_alamat', 'Desa Reuleut Timur, Kecamatan Muara Batu, Kabupaten Aceh Selatan', ''],
  ['tentang_pembuat', 'Tgk. Khairuddin Zakas, S.Pd., M.Pd', ''],
  ['tanggal_revisi', '-', ''],
  ['penerbit', 'Zakas_Ent', ''],
  ['versi', '2.0.0', '']
];
const SETTINGS_DEV_ONLY = ['iuran_salafi', 'iuran_wustha', 'iuran_ulya', 'tahunan_salafi', 'tahunan_wustha', 'tahunan_ulya', 'iuran_mulai'];
const JENIS_NOMOR = ['NIP', 'NIDN', 'NUPTK'];
function jenisNomor_(v) { const x = String(v || '').trim().toUpperCase(); return JENIS_NOMOR.indexOf(x) >= 0 ? x : 'NIP'; }

const DEFAULT_KELAS = [
  ['Kelas 1 Wustha Putra', 'Wustha'], ['Kelas 1 Wustha Putri', 'Wustha'], ['Kelas 1 Ulya', 'Ulya'], ['Kelas 1 Ulya Inti', 'Ulya'],
  ['Kelas 1 Salafi', 'Salafi'], ['Kelas 2 Wustha Putra', 'Wustha'], ['Kelas 2 Wustha Putri', 'Wustha'], ['Kelas 2 Ulya', 'Ulya'],
  ['Kelas 2 Ulya Inti', 'Ulya'], ['Kelas 2 Salafi', 'Salafi'], ['Kelas 3 Wustha', 'Wustha'], ['Kelas 3 Ulya', 'Ulya'],
  ['Kelas 3 Ulya Inti', 'Ulya'], ['Kelas 3 Salafi', 'Salafi'], ['Kelas 4 Salafi', 'Salafi'], ['Kelas 5 Salafi', 'Salafi'],
  ['Kelas 6 Salafi', 'Salafi']
];

const DEFAULT_SESI = [
  ['S1', '06.00 - 07.30', 'Salafi, PDF', 'Tidak'],
  ['S2', '09.00 - 11.00', 'PDF', 'Tidak'],
  ['S3', '14.00 - 16.00', 'PDF', 'Tidak'],
  ['S4', '16.30 - 18.00', 'Salafi', 'Tidak'],
  ['S5', '19.30 - 22.00', 'Salafi, PDF', 'Ya']
];
const HARI = ['Setiap Hari', 'Sabtu', 'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/* ============================================================
 *  WEB APP ENTRY
 * ============================================================ */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.api) return json_(apiGet_(p));
  // Aplikasi Android mengambil tampilan terbaru dari sini (tanpa iframe Google)
  if (p.app === 'html') return ContentService.createTextOutput(HtmlService.createHtmlOutputFromFile('Index').getContent()).setMimeType(ContentService.MimeType.TEXT);
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(getSetting_('nama_aplikasi') || 'ALHUDA MOBILE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** API untuk aplikasi Android: POST {token, action, params} → JSON */
function doPost(e) {
  let b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'Permintaan tidak valid' }); }
  return json_(api(b.token, b.action, b.params));
}

/** Endpoint JSON kecil untuk notifikasi latar belakang di aplikasi Android. */
function apiGet_(p) {
  try {
    const u = verify_(p.token);
    if (p.api === 'unread') return { ok: true, data: chatUnread_(u) };
    return { ok: false, error: 'Aksi tidak dikenal' };
  } catch (err) { return { ok: false, error: String(err.message || err) }; }
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ALHUDA MOBILE')
    .addItem('Setup awal (buat sheet & akun)', 'setupAwal')
    .addItem('Rapikan format semua sheet', 'rapikanFormat')
    .addToUi();
}

/* ============================================================
 *  API UTAMA — dipanggil dari aplikasi via google.script.run.api()
 * ============================================================ */
function api(token, action, params) {
  try {
    params = params || {};
    if (action === 'login') return ok_(login_(params));
    if (action === 'publicInfo') return ok_(publicInfo_());
    const u = verify_(token);
    const fn = ACTIONS[action];
    if (!fn) throw new Error('Aksi tidak dikenal: ' + action);
    // Anti-dobel: perubahan dari antrean offline membawa _cid unik. Bila sudah pernah diproses, kembalikan hasil yang sama.
    const cid = params._cid ? 'cid_' + lc_(u.username) + '_' + String(params._cid).replace(/[^\w-]/g, '').slice(0, 60) : '';
    if (cid) {
      const hit = CacheService.getScriptCache().get(cid);
      if (hit) return JSON.parse(hit);
      if (action === 'chat.send' && readAll_('Chat').some(c => c.id === String(params._cid))) return ok_({ id: String(params._cid), dariSaya: true, pesan: params.pesan, waktu: now_(), dibaca: false });
    }
    const res = ok_(fn(u, params));
    if (cid) { try { const t = JSON.stringify(res); if (t.length < 90000) CacheService.getScriptCache().put(cid, t, 21600); } catch (e) {} }
    return res;
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
}
function ok_(d) { return { ok: true, data: d === undefined ? null : d }; }

const ACTIONS = {
  boot: (u) => boot_(u),
  dashboard: (u) => dashboard_(u),
  // Roster & kelas
  'roster.list': (u, p) => rosterList_(u, p),
  'roster.save': (u, p) => rosterSave_(u, p),
  'roster.delete': (u, p) => rosterDelete_(u, p),
  'kelas.list': (u) => kelasList_(u),
  'users.list': (u, p) => usersList_(u, p),
  'users.save': (u, p) => usersSave_(u, p),
  'users.delete': (u, p) => usersDelete_(u, p),
  // Absen & izin
  'absen.form': (u, p) => absenForm_(u, p),
  'absen.save': (u, p) => absenSave_(u, p),
  'absen.rekap': (u, p) => absenRekap_(u, p),
  'absen.rekapKelas': (u, p) => absenRekapKelas_(u, p),
  'izinKeluar.list': (u, p) => izinList_(u, 'IzinKeluar', p),
  'izinKeluar.save': (u, p) => izinKeluarSave_(u, p),
  'izinKeluar.kembali': (u, p) => izinKembali_(u, 'IzinKeluar', p),
  'izinPulang.list': (u, p) => izinList_(u, 'IzinPulang', p),
  'izinPulang.save': (u, p) => izinPulangSave_(u, p),
  'izinPulang.kembali': (u, p) => izinKembali_(u, 'IzinPulang', p),
  'izin.delete': (u, p) => izinDelete_(u, p),
  'mengulang.list': (u) => mengulangList_(u),
  'mengulang.save': (u, p) => mengulangSave_(u, p),
  'mengulang.delete': (u, p) => mengulangDelete_(u, p),
  // Akademik
  'nilai.grid': (u, p) => nilaiGrid_(u, p),
  'nilai.save': (u, p) => nilaiSave_(u, p),
  'nilai.mapel': (u, p) => nilaiMapel_(u, p),
  'raport.periods': (u, p) => raportPeriods_(u, p),
  'raport.data': (u, p) => raportData_(u, p),
  'raport.naik': (u, p) => raportNaik_(u, p),
  'raport.pdf': (u, p) => raportPdf_(u, p),
  'iuran.get': (u, p) => iuranGet_(u, p),
  'iuran.save': (u, p) => iuranSave_(u, p),
  'iuran.delete': (u, p) => iuranDelete_(u, p),
  'iuran.pdf': (u, p) => iuranPdf_(u, p),
  'tahunan.get': (u, p) => tahunanGet_(u, p),
  'tahunan.save': (u, p) => tahunanSave_(u, p),
  'tahunan.delete': (u, p) => tahunanDelete_(u, p),
  'tahunan.pdf': (u, p) => tahunanPdf_(u, p),
  'saldo.get': (u, p) => saldoGet_(u, p),
  'saldo.save': (u, p) => saldoSave_(u, p),
  'saldo.summary': (u) => saldoSummary_(u),
  // Pengumuman
  'pengumuman.list': () => pengumumanList_(),
  'pengumuman.save': (u, p) => pengumumanSave_(u, p),
  'pengumuman.delete': (u, p) => pengumumanDelete_(u, p),
  // Chat
  'chat.contacts': (u) => chatContacts_(u),
  'chat.thread': (u, p) => chatThread_(u, p),
  'chat.send': (u, p) => chatSend_(u, p),
  'chat.unread': (u) => chatUnread_(u),
  // Profil & pengaturan
  'profil.save': (u, p) => profilSave_(u, p),
  'profil.get': (u, p) => profilGet_(u, p),
  'profil.galeriAdd': (u, p) => galeriAdd_(u, p),
  'profil.galeriDelete': (u, p) => galeriDelete_(u, p),
  'profil.photo': (u, p) => profilPhoto_(u, p),
  'profil.password': (u, p) => profilPassword_(u, p),
  'settings.get': (u) => settingsAll_(u),
  'settings.save': (u, p) => settingsSave_(u, p),
  'logo.get': (u) => logoGet_(u),
  'pemberitahuan': (u, p) => pemberitahuan_(u, p),
  'pelanggaran.list': (u) => pelanggaranList_(u),
  'pelanggaran.save': (u, p) => pelanggaranSave_(u, p),
  'pelanggaran.delete': (u, p) => pelanggaranDelete_(u, p),
  'logo.upload': (u, p) => logoUpload_(u, p),
  'logo.reset': (u, p) => logoReset_(u, p)
};

/* ============================================================
 *  LAPISAN DATA (Google Sheets)
 * ============================================================ */
const MEMO = {};
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name) {
  const ss = ss_();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    const h = SHEETS[name];
    s.getRange('A:Z').setNumberFormat('@');
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#0f6e4f').setFontColor('#ffffff');
    s.setFrozenRows(1);
  }
  return s;
}
function headers_(name) {
  const s = sh_(name);
  const lc = Math.max(s.getLastColumn(), 1);
  const h = s.getRange(1, 1, 1, lc).getValues()[0].map(x => String(x).trim());
  // tambahkan kolom yang hilang (bila admin menghapus kolom)
  const missing = SHEETS[name].filter(k => h.indexOf(k) < 0);
  if (missing.length) {
    s.getRange(1, h.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    return h.concat(missing);
  }
  return h;
}
function cell_(v) {
  if (v instanceof Date) {
    if (v.getFullYear() < 1901) return Utilities.formatDate(v, TZ, 'HH:mm');
    const t = Utilities.formatDate(v, TZ, 'HH:mm:ss');
    return Utilities.formatDate(v, TZ, t === '00:00:00' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss');
  }
  return v === null || v === undefined ? '' : String(v).trim();
}
function readAll_(name) {
  if (MEMO[name]) return MEMO[name];
  const s = sh_(name);
  const h = headers_(name);
  const lr = s.getLastRow();
  let rows = [];
  if (lr >= 2) {
    const v = s.getRange(2, 1, lr - 1, h.length).getValues();
    rows = v.map((r, i) => {
      const o = { _row: i + 2 };
      h.forEach((k, j) => { if (k) o[k] = cell_(r[j]); });
      return o;
    }).filter(o => h.some(k => k && o[k] !== ''));
  }
  MEMO[name] = rows;
  return rows;
}
function rowOf_(name, obj, h) { return h.map(k => (obj[k] === undefined || obj[k] === null) ? '' : String(obj[k])); }
function appendMany_(name, objs) {
  if (!objs.length) return;
  const s = sh_(name), h = headers_(name);
  const start = s.getLastRow() + 1;
  const rng = s.getRange(start, 1, objs.length, h.length);
  rng.setNumberFormat('@');
  rng.setValues(objs.map(o => rowOf_(name, o, h)));
  delete MEMO[name];
}
function append_(name, obj) { appendMany_(name, [obj]); }
function update_(name, row, patch) {
  const s = sh_(name), h = headers_(name);
  const cur = s.getRange(row, 1, 1, h.length).getValues()[0];
  const next = h.map((k, j) => patch.hasOwnProperty(k) ? String(patch[k] === null ? '' : patch[k]) : cur[j]);
  s.getRange(row, 1, 1, h.length).setValues([next]);
  delete MEMO[name];
}
function deleteRows_(name, rows) {
  const s = sh_(name);
  rows.slice().sort((a, b) => b - a).forEach(r => s.deleteRow(r));
  delete MEMO[name];
}
function tglValid_(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : ''; }
function waktuValid_(v) { return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(v || '')) ? String(v) : ''; }
function uid_() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function now_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function lock_(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(20000);
  try { return fn(); } finally { l.releaseLock(); }
}
function num_(v) { const n = Number(String(v).replace(/[^\d.-]/g, '')); return isNaN(n) ? 0 : n; }
function lc_(v) { return String(v || '').trim().toLowerCase(); }

/* ---------- Pengaturan ---------- */
function settingsMap_() {
  if (MEMO._settings) return MEMO._settings;
  const m = {};
  DEFAULT_SETTINGS.forEach(r => m[r[0]] = r[1]);
  readAll_('Pengaturan').forEach(r => { if (r.kunci) m[r.kunci] = r.nilai; });
  MEMO._settings = m;
  return m;
}
function getSetting_(k) { try { return settingsMap_()[k]; } catch (e) { return ''; } }

/* ============================================================
 *  SETUP AWAL
 * ============================================================ */
function setupAwal() {
  Object.keys(SHEETS).forEach(n => sh_(n));
  // pengaturan
  const ada = readAll_('Pengaturan').map(r => r.kunci);
  appendMany_('Pengaturan', DEFAULT_SETTINGS.filter(r => ada.indexOf(r[0]) < 0).map(r => ({ kunci: r[0], nilai: r[1], keterangan: r[2] })));
  if (!readAll_('Kelas').length) appendMany_('Kelas', DEFAULT_KELAS.map((k, i) => ({ nama: k[0], jenjang: k[1], urutan: i + 1 })));
  if (!readAll_('Sesi').length) appendMany_('Sesi', DEFAULT_SESI.map(s => ({ kode: s[0], jam: s[1], berlaku: s[2], wali_kelas: s[3] })));
  // akun
  if (!readAll_('Users').length) {
    const used = {};
    const mk = (nama) => {
      const base = usernameDari_(nama);
      let un = base, i = 2;
      while (used[un]) un = base + (i++);
      used[un] = true;
      return { un: un, pw: base + '123' };
    };
    const rows = [];
    SEED_GURU.forEach(g => {
      const a = mk(g.nama);
      rows.push({ username: a.un, password: a.pw, nama: g.nama, tipe: 'Guru', kabag: g.kabag, aktif: 'Ya', dibuat: now_() });
    });
    Object.keys(SEED_SANTRI).forEach(kelas => {
      SEED_SANTRI[kelas].forEach(nama => {
        const a = mk(nama);
        rows.push({ username: a.un, password: a.pw, nama: nama, tipe: 'Santri', kelas: kelas, aktif: 'Ya', dibuat: now_() });
      });
    });
    appendMany_('Users', rows);
  }
  if (!readAll_('Pengumuman').length) {
    append_('Pengumuman', { id: uid_(), tanggal: now_(), judul: 'Ujian Semester',
      isi: 'Ujian semester akan segera dilaksanakan. Seluruh santri diharapkan mempersiapkan diri.', oleh: 'khairuddin', aktif: 'Ya' });
  }
  secret_();
  const def = ss_().getSheetByName('Sheet1') || ss_().getSheetByName('Lembar1');
  if (def && ss_().getSheets().length > 1 && def.getLastRow() === 0) ss_().deleteSheet(def);
  try { SpreadsheetApp.getUi().alert('Setup selesai. Akun awal ada di sheet "Users" (password akan otomatis dienkripsi saat pengguna pertama kali login).'); } catch (e) {}
}
function rapikanFormat() { Object.keys(SHEETS).forEach(n => { sh_(n).getRange('A:Z').setNumberFormat('@'); sh_(n).autoResizeColumns(1, SHEETS[n].length); }); }

/** username = nama depan (tanpa gelar/inisial), huruf kecil */
function usernameDari_(nama) {
  const skip = ['tgk', 'm', 't', 'h', 'hj', 'dr', 'ust', 'ustadz'];
  const parts = String(nama).replace(/\(.*?\)/g, '').split(/[\s,]+/)
    .map(p => p.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const first = parts.find(p => skip.indexOf(p) < 0) || parts[0] || 'user';
  return first;
}

/* ============================================================
 *  AUTENTIKASI
 * ============================================================ */
function secret_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SECRET', s); }
  return s;
}
function b64_(bytes) { return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, ''); }
function unb64_(s) { s = String(s); while (s.length % 4) s += '='; return Utilities.newBlob(Utilities.base64DecodeWebSafe(s)).getDataAsString(); }
function sign_(str) { return b64_(Utilities.computeHmacSha256Signature(str, secret_())); }
function hashPw_(pw, salt) {
  salt = salt || Utilities.getUuid().slice(0, 8);
  const h = b64_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pw, Utilities.Charset.UTF_8));
  return 'h$' + salt + '$' + h;
}
function checkPw_(stored, pw) {
  stored = String(stored || '');
  if (stored.indexOf('h$') === 0) { const salt = stored.split('$')[1]; return hashPw_(pw, salt) === stored; }
  return stored !== '' && stored === String(pw);
}
function makeToken_(user) {
  const exp = Date.now() + 60 * 24 * 3600 * 1000; // 60 hari
  const payload = user.username + '|' + exp + '|' + sign_(String(user.password)).slice(0, 10);
  return b64_(Utilities.newBlob(payload).getBytes()) + '.' + sign_(payload);
}
function verify_(token) {
  if (!token) throw new Error('SESSION');
  const parts = String(token).split('.');
  if (parts.length !== 2) throw new Error('SESSION');
  let payload;
  try { payload = unb64_(parts[0]); } catch (e) { throw new Error('SESSION'); }
  if (sign_(payload) !== parts[1]) throw new Error('SESSION');
  const f = payload.split('|');
  if (Date.now() > Number(f[1])) throw new Error('SESSION');
  const user = findUser_(f[0]);
  if (!user || lc_(user.aktif) === 'tidak') throw new Error('SESSION');
  if (sign_(String(user.password)).slice(0, 10) !== f[2]) {
    throw new Error('SESSION');
  }
  return user;
}
function findUser_(username) { const k = lc_(username); return readAll_('Users').find(r => lc_(r.username) === k); }
function login_(p) {
  return lock_(() => {
    const user = findUser_(p.username);
    if (!user || !checkPw_(user.password, p.password)) throw new Error('Username atau password salah.');
    if (lc_(user.aktif) === 'tidak') throw new Error('Akun dinonaktifkan. Hubungi admin.');
    if (String(user.password).indexOf('h$') !== 0) {
      user.password = hashPw_(p.password);
      update_('Users', user._row, { password: user.password });
    }
    return { token: makeToken_(user), user: pub_(user), perms: perms_(user) };
  });
}
function publicInfo_() {
  const s = settingsMap_();
  return { nama_aplikasi: s.nama_aplikasi, nama_yayasan: s.nama_yayasan, logo: logoData_('logo_dayah') };
}

/* ---------- Peran & hak akses ---------- */
function roles_(u) { return String(u.kabag || '').split(',').map(s => s.trim()).filter(String); }
function isDev_(u) { return roles_(u).indexOf('Pengembang Aplikasi') >= 0; }
function can_(u) { // Pengembang & Admin selalu boleh, + kabag yang disebut
  const rs = roles_(u);
  if (rs.indexOf('Pengembang Aplikasi') >= 0 || rs.indexOf('Admin') >= 0) return true;
  for (let i = 1; i < arguments.length; i++) if (rs.indexOf(arguments[i]) >= 0) return true;
  return false;
}
function need_(ok, msg) { if (!ok) throw new Error(msg || 'Anda tidak memiliki akses untuk tindakan ini.'); }
function isGuru_(u) { return u.tipe === 'Guru'; }
function perms_(u) {
  return {
    dev: isDev_(u), admin: can_(u), guru: isGuru_(u),
    roster: can_(u, 'Kabag Pendidikan', 'Kabag Administrasi'),
    users: can_(u),
    absenJamaah: can_(u, 'Kabag Jamaah'),
    absenGuru: can_(u, 'Kabag Pendidikan'),
    izinKeluar: can_(u, 'Kabag Humas'),
    izinPulang: can_(u, 'Kabag Perizinan'),
    mengulang: can_(u, 'Kabag Pendidikan'),
    keuangan: can_(u, 'Kabag Bendahara'),
    nilaiSemua: can_(u, 'Kabag Pendidikan'),
    pengumuman: can_(u, 'Kabag Media', 'Kabag Pendidikan', 'Kabag Humas'),
    pelanggaran: can_(u, 'Kabag Algojo', 'Kabag Asrama'),
    hapus: can_(u),
    settings: can_(u)
  };
}
function pub_(u) {
  const o = {};
  SHEETS.Users.forEach(k => { if (k !== 'password') o[k] = u[k] || ''; });
  return o;
}
function mini_(u) { return { username: u.username, nama: u.nama, tipe: u.tipe, kelas: u.kelas, kabag: u.kabag, foto: u.foto }; }
function activeUsers_() { return readAll_('Users').filter(r => r.username && lc_(r.aktif) !== 'tidak'); }
function santriAll_() { return activeUsers_().filter(r => r.tipe === 'Santri'); }
function guruAll_() { return activeUsers_().filter(r => r.tipe === 'Guru'); }
function nameMap_() { const m = {}; readAll_('Users').forEach(r => m[lc_(r.username)] = r.nama); return m; }
function selfOrStaff_(u, username) {
  if (!username || lc_(username) === lc_(u.username)) return u.username;
  need_(isGuru_(u), 'Anda hanya dapat melihat data milik sendiri.');
  return username;
}

/* ============================================================
 *  BOOT & BERANDA
 * ============================================================ */
function kelasAll_() {
  return readAll_('Kelas').filter(k => k.nama).sort((a, b) => num_(a.urutan) - num_(b.urutan))
    .map(k => ({ nama: k.nama, jenjang: k.jenjang || 'Salafi' }));
}
function sesiAll_() { return readAll_('Sesi').filter(s => s.kode).map(s => ({ kode: s.kode, jam: s.jam, berlaku: s.berlaku, wali: lc_(s.wali_kelas) === 'ya' })); }
function boot_(u) {
  const s = settingsMap_();
  return {
    user: pub_(u), perms: perms_(u),
    settings: {
      nama_aplikasi: s.nama_aplikasi, nama_yayasan: s.nama_yayasan, nama_dayah: s.nama_dayah,
      nominal: nominalSemua_(), tahun_ajaran: s.tahun_ajaran,
      semester: s.semester, kkm: num_(s.kkm), logo: logoData_('logo_dayah'),
      tentang_pemilik: s.tentang_pemilik, tentang_alamat: s.tentang_alamat, tentang_pembuat: s.tentang_pembuat,
      tanggal_revisi: s.tanggal_revisi, penerbit: s.penerbit, versi: s.versi
    },
    kelas: kelasAll_(), sesi: sesiAll_(), hari: HARI, kabagList: KABAG_LIST,
    users: activeUsers_().map(mini_)
  };
}
function dashboard_(u) {
  const t = today_();
  const santri = santriAll_();
  const abs = readAll_('Absensi').filter(a => a.tanggal === t && a.jenis === 'Santri');
  const hadir = {}, izin = {};
  abs.forEach(a => { if (a.status === 'H') hadir[lc_(a.username)] = 1; if (a.status === 'I' || a.status === 'S') izin[lc_(a.username)] = 1; });
  readAll_('IzinPulang').filter(r => r.status === 'Pulang').forEach(r => izin[lc_(r.username)] = 1);
  Object.keys(izin).forEach(k => delete hadir[k]);
  let saldo = null;  // total saldo kas hanya untuk Admin & Bendahara
  if (u.tipe === 'Santri') saldo = saldoOf_(u.username);
  else if (perms_(u).keuangan) saldo = readAll_('Saldo').reduce((a, r) => a + (r.jenis === 'Keluar' ? -1 : 1) * num_(r.jumlah), 0);
  const p = pengumumanList_();
  return {
    jumlahSantri: santri.length, jumlahGuru: guruAll_().length,
    hadir: Object.keys(hadir).length, izinSakit: Object.keys(izin).length,
    saldo: saldo, saldoLabel: u.tipe === 'Santri' ? 'Saldo Kas Saya' : 'Total Saldo Kas Santri',
    pengumuman: p.slice(0, 3), unread: chatUnread_(u).count,
    notifHariIni: isGuru_(u) ? notifRingkas_(pemberitahuan_(u, { hari: 1 }).days[0]) : null,
    rosterSaya: rosterSaya_(u),
    tunggakan: u.tipe === 'Santri' ? tunggakan_(u.username) : null,
    nominalSaya: u.tipe === 'Santri' ? { iuran: nominalIuran_(u.kelas), tahunan: nominalTahunan_(u.kelas), jenjang: jenjangOf_(u.kelas) } : null
  };
}

/* ============================================================
 *  ROSTER PELAJARAN
 * ============================================================ */
function hariIni_() { return ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][Number(Utilities.formatDate(new Date(), TZ, 'u')) % 7]; }
function rosterAll_() {
  const nm = nameMap_();
  return readAll_('Roster').filter(r => r.id).map(r => ({
    id: r.id, kelas: r.kelas, sesi: r.sesi, hari: r.hari || 'Setiap Hari', mapel: r.mapel, guru: r.guru, guruNama: nm[lc_(r.guru)] || r.guru
  }));
}
function rosterList_(u, p) {
  let rows = rosterAll_();
  if (p.kelas) rows = rows.filter(r => r.kelas === p.kelas);
  if (p.guru) rows = rows.filter(r => lc_(r.guru) === lc_(p.guru));
  return rows;
}
function rosterSaya_(u) {
  const h = hariIni_();
  return rosterAll_().filter(r => (r.hari === 'Setiap Hari' || r.hari === h) &&
    (u.tipe === 'Santri' ? r.kelas === u.kelas : lc_(r.guru) === lc_(u.username)));
}
function jenjangOf_(kelas) { const k = kelasAll_().find(x => x.nama === kelas); return k ? k.jenjang : 'Salafi'; }
function sesiBolehUntuk_(sesi, kelas) {
  const s = sesiAll_().find(x => x.kode === sesi);
  if (!s) return false;
  const j = jenjangOf_(kelas) === 'Salafi' ? 'salafi' : 'pdf';
  return lc_(s.berlaku).split(/[\s,]+/).indexOf(j) >= 0;
}
function rosterSave_(u, p) {
  need_(perms_(u).roster, 'Hanya Kabag Pendidikan / Kabag Administrasi / Admin yang dapat mengubah roster.');
  if (!p.kelas || !p.sesi || !p.mapel || !p.guru) throw new Error('Kelas, sesi, mata pelajaran, dan guru wajib diisi.');
  const g = findUser_(p.guru);
  need_(g && g.tipe === 'Guru', 'Guru belum terdaftar sebagai pengguna. Daftarkan akun guru terlebih dahulu.');
  need_(sesiBolehUntuk_(p.sesi, p.kelas), 'Sesi ini tidak berlaku untuk kelas ' + p.kelas + '.');
  const hari = p.hari || 'Setiap Hari';
  return lock_(() => {
    const rows = readAll_('Roster');
    const dup = rows.find(r => r.id !== p.id && r.kelas === p.kelas && r.sesi === p.sesi && (r.hari || 'Setiap Hari') === hari);
    if (dup) throw new Error('Sesi tersebut sudah terisi untuk kelas ini (' + dup.mapel + '). Silakan edit data yang ada.');
    const obj = { kelas: p.kelas, sesi: p.sesi, hari: hari, mapel: String(p.mapel).trim(), guru: g.username, diubah_oleh: u.username, diubah: now_() };
    if (p.id) {
      const r = rows.find(x => x.id === p.id); if (!r) throw new Error('Data roster tidak ditemukan.');
      update_('Roster', r._row, obj);
    } else { obj.id = uid_(); append_('Roster', obj); }
    return true;
  });
}
function rosterDelete_(u, p) {
  need_(perms_(u).roster);
  return lock_(() => { const r = readAll_('Roster').find(x => x.id === p.id); if (r) deleteRows_('Roster', [r._row]); return true; });
}
/** Wali kelas = guru yang mengajar di sesi yang ditandai wali (19.30 - 22.00) */
function waliOf_(kelas) {
  const s = sesiAll_().find(x => x.wali);
  if (!s) return null;
  const r = rosterAll_().find(x => x.kelas === kelas && x.sesi === s.kode);
  if (!r) return null;
  const g = findUser_(r.guru) || {};
  return { username: r.guru, nama: r.guruNama, jenis: jenisNomor_(g.jenis_nomor), nomor: g.nis_nip || '' };
}

/* ============================================================
 *  KELAS, SANTRI & GURU
 * ============================================================ */
function kelasList_(u) {
  const s = santriAll_(), r = rosterAll_();
  const ws = sesiAll_().find(x => x.wali);
  return kelasAll_().map(k => {
    const w = ws && r.find(x => x.kelas === k.nama && x.sesi === ws.kode);
    return { nama: k.nama, jenjang: k.jenjang, jumlah: s.filter(x => x.kelas === k.nama).length, wali: w ? w.guruNama : '' };
  });
}
function usersList_(u, p) {
  const r = rosterAll_();
  const admin = can_(u);
  let rows = activeUsers_().concat(admin ? readAll_('Users').filter(x => lc_(x.aktif) === 'tidak') : []);
  if (p.tipe) rows = rows.filter(x => x.tipe === p.tipe);
  if (p.kelas) rows = rows.filter(x => x.kelas === p.kelas);
  return rows.map(x => {
    const o = { username: x.username, nama: x.nama, tipe: x.tipe, kelas: x.kelas, kabag: x.kabag, nis_nip: x.nis_nip, jenis_nomor: x.tipe === 'Guru' ? jenisNomor_(x.jenis_nomor) : '', asal: x.asal, foto: x.foto, aktif: x.aktif || 'Ya' };
    if (x.tipe === 'Guru') o.mengajar = Array.from(new Set(r.filter(y => lc_(y.guru) === lc_(x.username)).map(y => y.kelas))).join(', ');
    return o;
  }).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
}
function usersSave_(u, p) {
  need_(perms_(u).users, 'Hanya Admin yang dapat menambah / mengubah pengguna.');
  const un = lc_(p.username);
  if (!un || /\s/.test(un)) throw new Error('Username wajib diisi dan tidak boleh mengandung spasi.');
  if (!p.nama) throw new Error('Nama lengkap wajib diisi.');
  const tipe = p.tipe === 'Guru' ? 'Guru' : 'Santri';
  let kabag = '';
  if (tipe === 'Guru') {
    const list = (Array.isArray(p.kabag) ? p.kabag : String(p.kabag || '').split(',')).map(s => s.trim()).filter(Boolean);
    if (list.indexOf('Pengembang Aplikasi') >= 0) need_(isDev_(u), 'Hanya Pengembang Aplikasi yang dapat memberi peran Pengembang.');
    kabag = list.join(', ');
  } else {
    if (!p.kelas) throw new Error('Kelas santri wajib dipilih.');
  }
  return lock_(() => {
    const orig = p.original ? findUser_(p.original) : null;
    const clash = findUser_(un);
    if (clash && (!orig || clash._row !== orig._row)) throw new Error('Username "' + un + '" sudah dipakai.');
    const obj = { username: un, nama: String(p.nama).trim(), tipe: tipe, kabag: kabag, kelas: tipe === 'Santri' ? p.kelas : '',
      nis_nip: p.nis_nip || '', jenis_nomor: tipe === 'Guru' ? jenisNomor_(p.jenis_nomor) : '', asal: p.asal || '', aktif: p.aktif === 'Tidak' ? 'Tidak' : 'Ya' };
    if (p.password) obj.password = hashPw_(String(p.password));
    if (orig) {
      if (isDev_(orig) && !isDev_(u)) throw new Error('Akun Pengembang hanya dapat diubah oleh Pengembang.');
      update_('Users', orig._row, obj);
      if (lc_(orig.username) !== un) renameUser_(orig.username, un);
    } else {
      if (!p.password) throw new Error('Password wajib diisi untuk akun baru.');
      obj.dibuat = now_();
      append_('Users', obj);
    }
    return true;
  });
}
function usersDelete_(u, p) {
  need_(perms_(u).hapus);
  return lock_(() => {
    const x = findUser_(p.username); if (!x) return true;
    need_(!isDev_(x) || isDev_(u), 'Akun Pengembang tidak dapat dihapus.');
    need_(lc_(x.username) !== lc_(u.username), 'Tidak dapat menghapus akun sendiri.');
    deleteRows_('Users', [x._row]);
    return true;
  });
}
/** Mengganti username di seluruh sheet yang mereferensikannya */
function renameUser_(oldU, newU) {
  const cols = { Roster: ['guru', 'diubah_oleh'], Absensi: ['username', 'oleh'], IzinKeluar: ['username', 'oleh'], IzinPulang: ['username', 'oleh'],
    Mengulang: ['guru', 'santri', 'diubah_oleh'], Nilai: ['username', 'oleh'], Raport: ['username'], Iuran: ['username', 'oleh'],
    UangTahunan: ['username', 'oleh'], Saldo: ['username', 'oleh'], Pengumuman: ['oleh'], Chat: ['dari', 'ke'], Pelanggaran: ['username', 'oleh'] };
  const o = lc_(oldU);
  Object.keys(cols).forEach(name => {
    const s = sh_(name), h = headers_(name), lr = s.getLastRow();
    if (lr < 2) return;
    cols[name].forEach(c => {
      const j = h.indexOf(c); if (j < 0) return;
      const rng = s.getRange(2, j + 1, lr - 1, 1);
      const v = rng.getValues();
      let changed = false;
      v.forEach(r => {
        const parts = String(r[0]).split(',').map(x => x.trim());
        if (parts.some(x => lc_(x) === o)) { r[0] = parts.map(x => lc_(x) === o ? newU : x).join(','); changed = true; }
      });
      if (changed) rng.setValues(v);
    });
    delete MEMO[name];
  });
}

/* ============================================================
 *  ABSENSI (Santri / Jamaah / Guru)
 * ============================================================ */
const WAKTU_JAMAAH = ['Subuh', 'Zuhur', 'Ashar', 'Maghrib', 'Isya'];
function bolehAbsen_(u, jenis, kelas, sesi) {
  if (jenis === 'Jamaah') return can_(u, 'Kabag Jamaah');
  if (jenis === 'Guru') return can_(u, 'Kabag Pendidikan');
  if (can_(u, 'Kabag Pendidikan')) return true;
  return rosterAll_().some(r => r.kelas === kelas && r.sesi === sesi && lc_(r.guru) === lc_(u.username));
}
function absenForm_(u, p) {
  const jenis = p.jenis || 'Santri', tgl = p.tanggal || today_();
  need_(bolehAbsen_(u, jenis, p.kelas, p.sesi), jenis === 'Santri'
    ? 'Anda bukan guru pada kelas & sesi ini. Absen hanya dapat dilakukan oleh guru yang mengajar.'
    : 'Anda tidak memiliki akses untuk absen ini.');
  let anggota;
  if (jenis === 'Guru') anggota = guruAll_();
  else anggota = santriAll_().filter(s => !p.kelas || s.kelas === p.kelas);
  const ada = {};
  readAll_('Absensi').forEach(a => {
    if (a.jenis === jenis && a.tanggal === tgl && a.sesi === String(p.sesi || '') && (jenis === 'Guru' || a.kelas === (p.kelas || ''))) ada[lc_(a.username)] = a;
  });
  let mapel = '';
  if (jenis === 'Santri') { const r = rosterAll_().find(x => x.kelas === p.kelas && x.sesi === p.sesi); mapel = r ? r.mapel : ''; }
  return {
    mapel: mapel, tanggal: tgl,
    items: anggota.sort((a, b) => String(a.nama).localeCompare(String(b.nama))).map(s => ({
      username: s.username, nama: s.nama, kelas: s.kelas, status: (ada[lc_(s.username)] || {}).status || '', keterangan: (ada[lc_(s.username)] || {}).keterangan || ''
    }))
  };
}
function absenSave_(u, p) {
  const jenis = p.jenis || 'Santri', tgl = p.tanggal || today_();
  need_(bolehAbsen_(u, jenis, p.kelas, p.sesi), 'Anda tidak memiliki akses untuk absen ini.');
  const items = (p.items || []).filter(i => ['H', 'I', 'S', 'A'].indexOf(i.status) >= 0);
  return lock_(() => {
    const rows = readAll_('Absensi');
    const map = {};
    rows.forEach(a => { if (a.jenis === jenis && a.tanggal === tgl && a.sesi === String(p.sesi || '') && a.kelas === String(jenis === 'Guru' ? '' : (p.kelas || ''))) map[lc_(a.username)] = a; });
    const baru = [];
    items.forEach(i => {
      const obj = { tanggal: tgl, jenis: jenis, sesi: p.sesi || '', kelas: jenis === 'Guru' ? '' : (p.kelas || ''), mapel: p.mapel || '',
        username: i.username, status: i.status, keterangan: i.keterangan || '', oleh: u.username, waktu: now_() };
      const ex = map[lc_(i.username)];
      if (ex) { if (ex.status !== i.status || ex.keterangan !== (i.keterangan || '')) update_('Absensi', ex._row, obj); }
      else { obj.id = uid_(); baru.push(obj); }
    });
    appendMany_('Absensi', baru);
    return { tersimpan: items.length };
  });
}
function stat_(list) {
  const c = { H: 0, I: 0, S: 0, A: 0 };
  list.forEach(a => { if (c[a.status] !== undefined) c[a.status]++; });
  const total = c.H + c.I + c.S + c.A;
  return { total: total, hadir: c.H, izin: c.I, sakit: c.S, alpa: c.A, persen: total ? Math.round(c.H / total * 1000) / 10 : 0 };
}
function absenRekap_(u, p) {
  const jenis = p.jenis || 'Santri';
  if (jenis === 'Guru') need_(isGuru_(u), 'Menu ini tidak dapat diakses santri.');
  const un = selfOrStaff_(u, p.username);
  let list = readAll_('Absensi').filter(a => a.jenis === jenis && lc_(a.username) === lc_(un));
  if (p.bulan) list = list.filter(a => a.tanggal.indexOf(p.bulan) === 0);
  list.sort((a, b) => (b.tanggal + b.sesi).localeCompare(a.tanggal + a.sesi));
  const ses = {}; sesiAll_().forEach(s => ses[s.kode] = s.jam);
  return Object.assign(stat_(list), {
    items: list.slice(0, 150).map(a => ({ tanggal: a.tanggal, sesi: a.sesi, jam: ses[a.sesi] || a.sesi, mapel: a.mapel, status: a.status, keterangan: a.keterangan, kelas: a.kelas }))
  });
}
function absenRekapKelas_(u, p) {
  need_(isGuru_(u), 'Rekap kelas hanya untuk dewan guru.');
  const jenis = p.jenis || 'Santri';
  let rows = readAll_('Absensi').filter(a => a.jenis === jenis);
  if (p.bulan) rows = rows.filter(a => a.tanggal.indexOf(p.bulan) === 0);
  const anggota = jenis === 'Guru' ? guruAll_() : santriAll_().filter(s => s.kelas === p.kelas);
  return anggota.map(s => Object.assign({ username: s.username, nama: s.nama }, stat_(rows.filter(a => lc_(a.username) === lc_(s.username)))))
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
}

/* ============================================================
 *  IZIN KELUAR SEBENTAR & PERIZINAN PULANG
 * ============================================================ */
function izinList_(u, sheet, p) {
  const nm = nameMap_(); const users = {}; readAll_('Users').forEach(r => users[lc_(r.username)] = r);
  let rows = readAll_(sheet).filter(r => r.id);
  if (u.tipe === 'Santri') rows = rows.filter(r => lc_(r.username) === lc_(u.username));
  if (p && p.status) rows = rows.filter(r => r.status === p.status);
  rows.sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)));
  return rows.slice(0, 200).map(r => Object.assign({}, r, { _row: undefined, nama: nm[lc_(r.username)] || r.username,
    kelas: (users[lc_(r.username)] || {}).kelas || '', olehNama: nm[lc_(r.oleh)] || r.oleh }));
}
function izinKeluarSave_(u, p) {
  need_(perms_(u).izinKeluar, 'Izin keluar hanya dapat dicatat oleh Kabag Humas.');
  const s = findUser_(p.username); need_(s && s.tipe === 'Santri', 'Santri tidak ditemukan.');
  if (!p.keperluan) throw new Error('Keperluan wajib diisi.');
  append_('IzinKeluar', { id: uid_(), tanggal: tglValid_(p.tanggal) || today_(), username: s.username, keperluan: p.keperluan, jam_keluar: p.jam_keluar || Utilities.formatDate(new Date(), TZ, 'HH:mm'),
    jam_kembali: '', status: 'Keluar', oleh: u.username, waktu: now_() });
  return true;
}
function izinPulangSave_(u, p) {
  need_(perms_(u).izinPulang, 'Perizinan pulang hanya dapat dicatat oleh Kabag Perizinan.');
  const s = findUser_(p.username); need_(s && s.tipe === 'Santri', 'Santri tidak ditemukan.');
  if (!p.tgl_pulang || !p.alasan) throw new Error('Tanggal pulang dan alasan wajib diisi.');
  append_('IzinPulang', { id: uid_(), username: s.username, tgl_pulang: p.tgl_pulang, tgl_kembali: p.tgl_kembali || '', alasan: p.alasan,
    status: 'Pulang', oleh: u.username, waktu: now_() });
  return true;
}
function izinKembali_(u, sheet, p) {
  need_(sheet === 'IzinKeluar' ? perms_(u).izinKeluar : perms_(u).izinPulang);
  return lock_(() => {
    const r = readAll_(sheet).find(x => x.id === p.id); if (!r) throw new Error('Data tidak ditemukan.');
    const patch = { status: 'Kembali' };
    if (sheet === 'IzinKeluar') patch.jam_kembali = /^\d{2}:\d{2}$/.test(p.jam || '') ? p.jam : Utilities.formatDate(new Date(), TZ, 'HH:mm');
    else patch.tgl_kembali = tglValid_(p.tanggal) || today_();
    update_(sheet, r._row, patch);
    return true;
  });
}
function izinDelete_(u, p) {
  need_(perms_(u).hapus);
  const sheet = p.sheet === 'IzinPulang' ? 'IzinPulang' : 'IzinKeluar';
  return lock_(() => { const r = readAll_(sheet).find(x => x.id === p.id); if (r) deleteRows_(sheet, [r._row]); return true; });
}

/* ============================================================
 *  DAFTAR MENGULANG MALAM (22.30 - 23.30)
 * ============================================================ */
function mengulangList_(u) {
  const users = {}; readAll_('Users').forEach(r => users[lc_(r.username)] = r);
  const kOrder = {}; kelasAll_().forEach((k, i) => kOrder[k.nama] = i);
  return readAll_('Mengulang').filter(r => r.id).map(r => ({
    id: r.id, guru: r.guru, guruNama: (users[lc_(r.guru)] || {}).nama || r.guru, lokasi: r.lokasi,
    santri: String(r.santri || '').split(',').map(x => x.trim()).filter(Boolean).map(x => {
      const s = users[lc_(x)] || {}; return { username: x, nama: s.nama || x, kelas: s.kelas || '' };
    }).sort((a, b) => (kOrder[a.kelas] || 0) - (kOrder[b.kelas] || 0) || String(a.nama).localeCompare(String(b.nama)))
  }));
}
function mengulangSave_(u, p) {
  need_(perms_(u).mengulang, 'Daftar mengulang hanya dapat diubah oleh Kabag Pendidikan.');
  const g = findUser_(p.guru); need_(g && g.tipe === 'Guru', 'Guru wajib dipilih dari guru yang terdaftar.');
  const santri = (p.santri || []).filter(x => { const s = findUser_(x); return s && s.tipe === 'Santri'; });
  if (!santri.length) throw new Error('Pilih minimal satu santri.');
  const obj = { guru: g.username, santri: santri.join(','), lokasi: p.lokasi || '', diubah_oleh: u.username, diubah: now_() };
  return lock_(() => {
    if (p.id) { const r = readAll_('Mengulang').find(x => x.id === p.id); if (!r) throw new Error('Data tidak ditemukan.'); update_('Mengulang', r._row, obj); }
    else { obj.id = uid_(); append_('Mengulang', obj); }
    return true;
  });
}
function mengulangDelete_(u, p) {
  need_(perms_(u).mengulang);
  return lock_(() => { const r = readAll_('Mengulang').find(x => x.id === p.id); if (r) deleteRows_('Mengulang', [r._row]); return true; });
}

/* ============================================================
 *  NILAI & RAPORT
 * ============================================================ */
function bolehNilai_(u, kelas, mapel) {
  if (can_(u, 'Kabag Pendidikan')) return true;
  return rosterAll_().some(r => r.kelas === kelas && lc_(r.guru) === lc_(u.username) && (!mapel || lc_(r.mapel) === lc_(mapel)));
}
function nilaiMapel_(u, p) {
  const set = {};
  rosterAll_().filter(r => r.kelas === p.kelas && (can_(u, 'Kabag Pendidikan') || lc_(r.guru) === lc_(u.username))).forEach(r => set[r.mapel] = 1);
  if (can_(u, 'Kabag Pendidikan')) readAll_('Nilai').filter(n => n.kelas === p.kelas).forEach(n => set[n.mapel] = 1);
  return Object.keys(set).sort();
}
function nilaiGrid_(u, p) {
  need_(bolehNilai_(u, p.kelas, p.mapel), 'Anda tidak mengajar mata pelajaran ini di kelas tersebut.');
  const ada = {};
  readAll_('Nilai').forEach(n => { if (n.kelas === p.kelas && n.tahun_ajaran === p.tahun_ajaran && String(n.semester) === String(p.semester) && lc_(n.mapel) === lc_(p.mapel)) ada[lc_(n.username)] = n.nilai; });
  return santriAll_().filter(s => s.kelas === p.kelas).sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
    .map(s => ({ username: s.username, nama: s.nama, nilai: ada[lc_(s.username)] || '' }));
}
function nilaiSave_(u, p) {
  need_(bolehNilai_(u, p.kelas, p.mapel), 'Anda tidak mengajar mata pelajaran ini di kelas tersebut.');
  if (!p.mapel || !p.tahun_ajaran || !p.semester) throw new Error('Data periode / mapel belum lengkap.');
  return lock_(() => {
    const map = {};
    readAll_('Nilai').forEach(n => { if (n.kelas === p.kelas && n.tahun_ajaran === p.tahun_ajaran && String(n.semester) === String(p.semester) && lc_(n.mapel) === lc_(p.mapel)) map[lc_(n.username)] = n; });
    const baru = [];
    (p.items || []).forEach(i => {
      if (i.nilai === '' || i.nilai === null || i.nilai === undefined) return;
      const v = Math.max(0, Math.min(100, num_(i.nilai)));
      const obj = { username: i.username, kelas: p.kelas, tahun_ajaran: p.tahun_ajaran, semester: String(p.semester), mapel: p.mapel, nilai: v, oleh: u.username, waktu: now_() };
      const ex = map[lc_(i.username)];
      if (ex) { if (num_(ex.nilai) !== v) update_('Nilai', ex._row, obj); } else { obj.id = uid_(); baru.push(obj); }
    });
    appendMany_('Nilai', baru);
    return true;
  });
}
function predikat_(n) {
  if (n >= 90) return 'A (Mumtaz)';
  if (n >= 80) return 'B (Jayyid Jiddan)';
  if (n >= 70) return 'C (Jayyid)';
  if (n >= 60) return 'D (Maqbul)';
  return 'E (Rasib)';
}
function raportPeriods_(u, p) {
  const un = selfOrStaff_(u, p.username);
  const set = {};
  readAll_('Nilai').filter(n => lc_(n.username) === lc_(un)).forEach(n => set[n.kelas + '|' + n.tahun_ajaran + '|' + n.semester] = 1);
  const s = settingsMap_(); const me = findUser_(un) || {};
  set[(me.kelas || '') + '|' + s.tahun_ajaran + '|' + s.semester] = 1;
  return Object.keys(set).map(k => { const f = k.split('|'); return { kelas: f[0], tahun_ajaran: f[1], semester: f[2] }; })
    .sort((a, b) => (b.tahun_ajaran + b.semester).localeCompare(a.tahun_ajaran + a.semester));
}
function raportData_(u, p) {
  const un = selfOrStaff_(u, p.username);
  const st = settingsMap_();
  const santri = findUser_(un); if (!santri) throw new Error('Santri tidak ditemukan.');
  const ta = p.tahun_ajaran || st.tahun_ajaran, sem = String(p.semester || st.semester);
  const all = readAll_('Nilai').filter(n => n.tahun_ajaran === ta && String(n.semester) === sem);
  let kelas = p.kelas || (all.find(n => lc_(n.username) === lc_(un)) || {}).kelas || santri.kelas;
  const mine = all.filter(n => lc_(n.username) === lc_(un) && n.kelas === kelas).sort((a, b) => a.mapel.localeCompare(b.mapel));
  const kkm = num_(st.kkm) || 70;
  const items = mine.map(n => { const v = num_(n.nilai); return { mapel: n.mapel, nilai: v, predikat: predikat_(v), keterangan: v >= kkm ? 'Tuntas' : 'Belum Tuntas' }; });
  const rata = items.length ? Math.round(items.reduce((a, b) => a + b.nilai, 0) / items.length * 100) / 100 : 0;
  // peringkat di kelas
  const per = {};
  all.filter(n => n.kelas === kelas).forEach(n => { const k = lc_(n.username); per[k] = per[k] || { s: 0, c: 0 }; per[k].s += num_(n.nilai); per[k].c++; });
  const avgs = Object.keys(per).map(k => ({ k: k, a: per[k].s / per[k].c })).sort((a, b) => b.a - a.a);
  const idx = avgs.findIndex(x => x.k === lc_(un));
  const rp = readAll_('Raport').find(r => lc_(r.username) === lc_(un) && r.tahun_ajaran === ta && String(r.semester) === sem);
  const wali = waliOf_(kelas);
  return {
    santri: { username: santri.username, nama: santri.nama, nis: santri.nis_nip, kelas: kelas },
    tahun_ajaran: ta, semester: sem, jenjang: jenjangOf_(kelas), items: items, rata: rata,
    peringkat: idx >= 0 ? (idx + 1) : '-', jumlahSantri: avgs.length, naik_kelas: rp ? rp.naik_kelas : '',
    wali: wali ? wali.nama : '', waliJenis: wali ? wali.jenis : 'NIP', waliNomor: wali ? wali.nomor : '', bolehNaik: !!(can_(u, 'Kabag Pendidikan') || (wali && lc_(wali.username) === lc_(u.username)))
  };
}
function raportNaik_(u, p) {
  const d = raportData_(u, p);
  need_(d.bolehNaik, 'Hanya wali kelas / Kabag Pendidikan yang dapat mengisi status naik kelas.');
  return lock_(() => {
    const r = readAll_('Raport').find(x => lc_(x.username) === lc_(p.username) && x.tahun_ajaran === d.tahun_ajaran && String(x.semester) === d.semester);
    const obj = { username: d.santri.username, kelas: d.santri.kelas, tahun_ajaran: d.tahun_ajaran, semester: d.semester, naik_kelas: p.naik_kelas || '', catatan: p.catatan || '' };
    if (r) update_('Raport', r._row, obj); else append_('Raport', obj);
    return true;
  });
}

/* ============================================================
 *  KEUANGAN: Iuran Bulanan, Uang Tahunan, Saldo
 *  Nominal dibedakan per jenjang (Salafi / PDF Wustha / PDF Ulya) — diubah oleh Pengembang Aplikasi
 * ============================================================ */
function jkey_(kelas) { const j = jenjangOf_(kelas); return j === 'Wustha' ? 'wustha' : j === 'Ulya' ? 'ulya' : 'salafi'; }
function nominalIuran_(kelas) { return num_(getSetting_('iuran_' + jkey_(kelas))); }
function nominalTahunan_(kelas) { return num_(getSetting_('tahunan_' + jkey_(kelas))); }
function nominalSemua_() {
  const o = {};
  ['salafi', 'wustha', 'ulya'].forEach(j => { o[j] = { iuran: num_(getSetting_('iuran_' + j)), tahunan: num_(getSetting_('tahunan_' + j)) }; });
  return o;
}
/** Bulan pertama yang ditagih: pengaturan iuran_mulai, atau Juli tahun awal tahun ajaran aktif. */
function iuranMulai_() {
  const v = String(getSetting_('iuran_mulai') || '').trim();
  const m = v.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return { y: +m[1], m: +m[2] };
  const ta = String(getSetting_('tahun_ajaran') || '').match(/^(\d{4})/);
  return { y: ta ? +ta[1] : +Utilities.formatDate(new Date(), TZ, 'yyyy'), m: 7 };
}
/** Tunggakan santri: bulan-bulan yang sudah lewat & belum lunas, serta sisa uang tahunan tahun ajaran aktif. */
function tunggakan_(un) {
  const s = findUser_(un); if (!s || s.tipe !== 'Santri') return null;
  const nb = nominalIuran_(s.kelas), nt = nominalTahunan_(s.kelas);
  const now = { y: +Utilities.formatDate(new Date(), TZ, 'yyyy'), m: +Utilities.formatDate(new Date(), TZ, 'M') };
  const paid = {};
  readAll_('Iuran').filter(r => lc_(r.username) === lc_(un)).forEach(r => { const k = num_(r.tahun) + '-' + num_(r.bulan); paid[k] = (paid[k] || 0) + num_(r.jumlah); });
  const bulan = []; let total = 0;
  let c = iuranMulai_();
  for (let guard = 0; guard < 120 && (c.y < now.y || (c.y === now.y && c.m < now.m)); guard++) {  // hanya bulan yang sudah lewat
    const kurang = nb - (paid[c.y + '-' + c.m] || 0);
    if (nb > 0 && kurang > 0) { bulan.push({ tahun: c.y, bulan: c.m, nama: BULAN[c.m - 1], kurang: kurang }); total += kurang; }
    c = c.m === 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m: c.m + 1 };
  }
  const ta = getSetting_('tahun_ajaran');
  const bayarT = readAll_('UangTahunan').filter(r => lc_(r.username) === lc_(un) && r.tahun_ajaran === ta).reduce((a, r) => a + num_(r.jumlah), 0);
  const sisaT = Math.max(0, nt - bayarT);
  if (!bulan.length && !sisaT) return null;
  return { iuran: { jumlahBulan: bulan.length, bulan: bulan, total: total, nominal: nb }, tahunan: { tahun_ajaran: ta, nominal: nt, dibayar: bayarT, sisa: sisaT } };
}
function iuranGet_(u, p) {
  const un = selfOrStaff_(u, p.username);
  const tahun = String(p.tahun || Utilities.formatDate(new Date(), TZ, 'yyyy'));
  const s = findUser_(un) || {};
  const nominal = nominalIuran_(s.kelas);
  const rows = readAll_('Iuran').filter(r => lc_(r.username) === lc_(un) && String(r.tahun) === tahun);
  const bulan = BULAN.map((b, i) => {
    const r = rows.find(x => num_(x.bulan) === i + 1);
    return { bulan: i + 1, nama: b, jumlah: r ? num_(r.jumlah) : 0, tanggal: r ? r.tanggal : '', id: r ? r.id : '', lunas: r ? num_(r.jumlah) >= nominal : false, keterangan: r ? r.keterangan : '' };
  });
  return { santri: { username: s.username, nama: s.nama, kelas: s.kelas, nis: s.nis_nip }, tahun: tahun, nominal: nominal, bulan: bulan,
    totalBayar: bulan.reduce((a, b) => a + b.jumlah, 0), lunas: bulan.filter(b => b.lunas).length };
}
function iuranSave_(u, p) {
  need_(perms_(u).keuangan, 'Pembayaran hanya dapat dicatat oleh Kabag Bendahara.');
  const s = findUser_(p.username); need_(s && s.tipe === 'Santri', 'Santri tidak ditemukan.');
  const bulan = num_(p.bulan); if (bulan < 1 || bulan > 12) throw new Error('Bulan tidak valid.');
  const obj = { username: s.username, tahun: String(p.tahun), bulan: bulan, jumlah: num_(p.jumlah), tanggal: p.tanggal || today_(), oleh: u.username, keterangan: p.keterangan || '' };
  return lock_(() => {
    const r = readAll_('Iuran').find(x => lc_(x.username) === lc_(s.username) && String(x.tahun) === String(p.tahun) && num_(x.bulan) === bulan);
    if (r) update_('Iuran', r._row, obj); else { obj.id = uid_(); append_('Iuran', obj); }
    return true;
  });
}
function iuranDelete_(u, p) {
  need_(perms_(u).keuangan);
  return lock_(() => { const r = readAll_('Iuran').find(x => x.id === p.id); if (r) deleteRows_('Iuran', [r._row]); return true; });
}
function tahunanGet_(u, p) {
  const un = selfOrStaff_(u, p.username);
  const ta = p.tahun_ajaran || getSetting_('tahun_ajaran');
  const nominal = nominalTahunan_((findUser_(un) || {}).kelas);
  const all = readAll_('UangTahunan').filter(r => lc_(r.username) === lc_(un));
  const rows = all.filter(r => r.tahun_ajaran === ta).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  const total = rows.reduce((a, r) => a + num_(r.jumlah), 0);
  const s = findUser_(un) || {};
  const periods = Array.from(new Set(all.map(r => r.tahun_ajaran).concat([getSetting_('tahun_ajaran')]))).sort().reverse();
  return { santri: { username: s.username, nama: s.nama, kelas: s.kelas, nis: s.nis_nip }, tahun_ajaran: ta, nominal: nominal,
    items: rows.map(r => ({ id: r.id, tanggal: r.tanggal, jumlah: num_(r.jumlah), keterangan: r.keterangan })),
    total: total, sisa: Math.max(0, nominal - total), lunas: total >= nominal, periods: periods };
}
function tahunanSave_(u, p) {
  need_(perms_(u).keuangan, 'Pembayaran hanya dapat dicatat oleh Kabag Bendahara.');
  const s = findUser_(p.username); need_(s && s.tipe === 'Santri', 'Santri tidak ditemukan.');
  if (num_(p.jumlah) <= 0) throw new Error('Jumlah harus lebih dari 0.');
  append_('UangTahunan', { id: uid_(), username: s.username, tahun_ajaran: p.tahun_ajaran || getSetting_('tahun_ajaran'), jumlah: num_(p.jumlah),
    tanggal: p.tanggal || today_(), oleh: u.username, keterangan: p.keterangan || '' });
  return true;
}
function tahunanDelete_(u, p) {
  need_(perms_(u).keuangan);
  return lock_(() => { const r = readAll_('UangTahunan').find(x => x.id === p.id); if (r) deleteRows_('UangTahunan', [r._row]); return true; });
}
function saldoOf_(un) { return readAll_('Saldo').filter(r => lc_(r.username) === lc_(un)).reduce((a, r) => a + (r.jenis === 'Keluar' ? -1 : 1) * num_(r.jumlah), 0); }
function saldoGet_(u, p) {
  const un = selfOrStaff_(u, p.username);
  const rows = readAll_('Saldo').filter(r => lc_(r.username) === lc_(un)).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  const s = findUser_(un) || {};
  return { santri: { username: s.username, nama: s.nama, kelas: s.kelas }, saldo: saldoOf_(un),
    items: rows.slice(0, 200).map(r => ({ id: r.id, tanggal: r.tanggal, jenis: r.jenis, jumlah: num_(r.jumlah), keterangan: r.keterangan })) };
}
function saldoSave_(u, p) {
  need_(perms_(u).keuangan, 'Saldo hanya dapat diubah oleh Kabag Bendahara.');
  const s = findUser_(p.username); need_(s && s.tipe === 'Santri', 'Santri tidak ditemukan.');
  const j = num_(p.jumlah); if (j <= 0) throw new Error('Jumlah harus lebih dari 0.');
  const jenis = p.jenis === 'Keluar' ? 'Keluar' : 'Masuk';
  return lock_(() => {
    if (jenis === 'Keluar' && saldoOf_(s.username) < j) throw new Error('Saldo tidak mencukupi.');
    append_('Saldo', { id: uid_(), username: s.username, tanggal: waktuValid_(p.tanggal) || now_(), jenis: jenis, jumlah: j, keterangan: p.keterangan || '', oleh: u.username });
    return { saldo: saldoOf_(s.username) };
  });
}
function saldoSummary_(u) {
  need_(perms_(u).keuangan, 'Total saldo kas hanya dapat dilihat Admin & Bendahara.');
  const map = {};
  readAll_('Saldo').forEach(r => { const k = lc_(r.username); map[k] = (map[k] || 0) + (r.jenis === 'Keluar' ? -1 : 1) * num_(r.jumlah); });
  const list = santriAll_().map(s => ({ username: s.username, nama: s.nama, kelas: s.kelas, saldo: map[lc_(s.username)] || 0 }))
    .sort((a, b) => b.saldo - a.saldo);
  return { total: list.reduce((a, b) => a + b.saldo, 0), items: list };
}

/* ============================================================
 *  PEMBERITAHUAN HARI INI (khusus dewan guru)
 *  Santri tidak naik ngaji, tidak jamaah, pulang, keluar sebentar, pelanggaran
 *  — dikelompokkan per tanggal: hari ini, kemarin, kemarin lusa, dst.
 * ============================================================ */
function pemberitahuan_(u, p) {
  need_(isGuru_(u), 'Menu ini khusus dewan guru.');
  const hari = Math.min(60, Math.max(1, num_(p.hari) || 7));
  const dates = [];
  for (let i = 0; i < hari; i++) dates.push(Utilities.formatDate(new Date(Date.now() - i * 864e5), TZ, 'yyyy-MM-dd'));
  const days = {};
  dates.forEach(d => days[d] = { tanggal: d, ngaji: [], jamaah: [], pulang: [], keluar: [], pelanggaran: [] });
  const users = {}; readAll_('Users').forEach(r => users[lc_(r.username)] = r);
  const who = un => { const x = users[lc_(un)] || {}; return { username: un, nama: x.nama || un, kelas: x.kelas || '' }; };
  const ses = {}; sesiAll_().forEach(x => ses[x.kode] = x.jam);
  readAll_('Absensi').forEach(a => {
    const d = days[a.tanggal]; if (!d || a.status === 'H' || !a.status) return;
    if (a.jenis === 'Santri') d.ngaji.push(Object.assign(who(a.username), { status: a.status, sesi: a.sesi, jam: ses[a.sesi] || a.sesi, mapel: a.mapel, keterangan: a.keterangan }));
    else if (a.jenis === 'Jamaah') d.jamaah.push(Object.assign(who(a.username), { status: a.status, waktu: a.sesi, keterangan: a.keterangan }));
  });
  readAll_('IzinPulang').forEach(r => { const d = days[r.tgl_pulang]; if (d && r.id) d.pulang.push(Object.assign(who(r.username), { alasan: r.alasan, tgl_pulang: r.tgl_pulang, tgl_kembali: r.tgl_kembali, status: r.status })); });
  readAll_('IzinKeluar').forEach(r => { const d = days[r.tanggal]; if (d && r.id) d.keluar.push(Object.assign(who(r.username), { keperluan: r.keperluan, jam_keluar: r.jam_keluar, jam_kembali: r.jam_kembali, status: r.status })); });
  readAll_('Pelanggaran').forEach(r => { const d = days[r.tanggal]; if (d && r.id) d.pelanggaran.push(Object.assign(who(r.username), { id: r.id, pelanggaran: r.pelanggaran, sanksi: r.sanksi, oleh: (users[lc_(r.oleh)] || {}).nama || r.oleh })); });
  const ko = {}; kelasAll_().forEach((k, i) => ko[k.nama] = i);
  const sortFn = (a, b) => (ko[a.kelas] === undefined ? 99 : ko[a.kelas]) - (ko[b.kelas] === undefined ? 99 : ko[b.kelas]) || String(a.nama).localeCompare(String(b.nama));
  dates.forEach(d => ['ngaji', 'jamaah', 'pulang', 'keluar', 'pelanggaran'].forEach(k => days[d][k].sort(sortFn)));
  return { hari: hari, days: dates.map(d => days[d]) };
}
function notifRingkas_(d) {
  const o = { ngaji: d.ngaji.length, jamaah: d.jamaah.length, pulang: d.pulang.length, keluar: d.keluar.length, pelanggaran: d.pelanggaran.length };
  o.total = o.ngaji + o.jamaah + o.pulang + o.keluar + o.pelanggaran;
  return o;
}

/* ---------- Pelanggaran santri (dicatat Kabag Algojo / Kabag Asrama / Admin) ---------- */
function pelanggaranList_(u) {
  need_(isGuru_(u), 'Menu ini khusus dewan guru.');
  const users = {}; readAll_('Users').forEach(r => users[lc_(r.username)] = r);
  return readAll_('Pelanggaran').filter(r => r.id).sort((a, b) => String(b.tanggal + b.waktu).localeCompare(String(a.tanggal + a.waktu))).slice(0, 300)
    .map(r => ({ id: r.id, tanggal: r.tanggal, username: r.username, nama: (users[lc_(r.username)] || {}).nama || r.username, kelas: (users[lc_(r.username)] || {}).kelas || '',
      pelanggaran: r.pelanggaran, sanksi: r.sanksi, oleh: (users[lc_(r.oleh)] || {}).nama || r.oleh }));
}
function pelanggaranSave_(u, p) {
  need_(perms_(u).pelanggaran, 'Pelanggaran hanya dapat dicatat oleh Kabag Algojo / Kabag Asrama.');
  const s = findUser_(p.username); need_(s && s.tipe === 'Santri', 'Santri tidak ditemukan.');
  if (!String(p.pelanggaran || '').trim()) throw new Error('Jenis pelanggaran wajib diisi.');
  const obj = { tanggal: tglValid_(p.tanggal) || today_(), username: s.username, pelanggaran: String(p.pelanggaran).trim(), sanksi: p.sanksi || '', oleh: u.username, waktu: now_() };
  return lock_(() => {
    if (p.id) { const r = readAll_('Pelanggaran').find(x => x.id === p.id); if (!r) throw new Error('Data tidak ditemukan.'); update_('Pelanggaran', r._row, obj); }
    else { obj.id = uid_(); append_('Pelanggaran', obj); }
    return true;
  });
}
function pelanggaranDelete_(u, p) {
  need_(perms_(u).pelanggaran);
  return lock_(() => { const r = readAll_('Pelanggaran').find(x => x.id === p.id); if (r) deleteRows_('Pelanggaran', [r._row]); return true; });
}

/* ============================================================
 *  PENGUMUMAN
 * ============================================================ */
function pengumumanList_() {
  const nm = nameMap_();
  return readAll_('Pengumuman').filter(r => r.id && lc_(r.aktif) !== 'tidak')
    .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
    .slice(0, 30).map(r => ({ id: r.id, tanggal: r.tanggal, judul: r.judul, isi: r.isi, oleh: nm[lc_(r.oleh)] || r.oleh }));
}
function pengumumanSave_(u, p) {
  need_(perms_(u).pengumuman, 'Tidak memiliki akses membuat pengumuman.');
  if (!p.isi) throw new Error('Isi pengumuman wajib diisi.');
  return lock_(() => {
    const obj = { judul: p.judul || 'Pengumuman', isi: p.isi, oleh: u.username, aktif: 'Ya' };
    if (p.id) { const r = readAll_('Pengumuman').find(x => x.id === p.id); if (r) update_('Pengumuman', r._row, obj); }
    else { obj.id = uid_(); obj.tanggal = now_(); append_('Pengumuman', obj); }
    return true;
  });
}
function pengumumanDelete_(u, p) {
  need_(perms_(u).pengumuman);
  return lock_(() => { const r = readAll_('Pengumuman').find(x => x.id === p.id); if (r) deleteRows_('Pengumuman', [r._row]); return true; });
}

/* ============================================================
 *  ROOM CHAT (pesan pribadi — hanya pengirim & penerima)
 * ============================================================ */
function chatContacts_(u) {
  const me = lc_(u.username);
  const last = {}, unread = {};
  readAll_('Chat').forEach(c => {
    const d = lc_(c.dari), k = lc_(c.ke);
    if (d !== me && k !== me) return;
    const other = d === me ? k : d;
    if (!last[other] || String(c.waktu) > String(last[other].waktu)) last[other] = c;
    if (k === me && c.dibaca !== 'Ya') unread[other] = (unread[other] || 0) + 1;
  });
  return activeUsers_().filter(x => lc_(x.username) !== me).map(x => {
    const k = lc_(x.username), l = last[k];
    return { username: x.username, nama: x.nama, tipe: x.tipe, kelas: x.kelas, kabag: x.kabag, foto: x.foto,
      last: l ? { pesan: l.pesan, waktu: l.waktu, dariSaya: lc_(l.dari) === me } : null, unread: unread[k] || 0 };
  }).sort((a, b) => (b.last ? b.last.waktu : '').localeCompare(a.last ? a.last.waktu : '') || String(a.nama).localeCompare(String(b.nama)));
}
function chatThread_(u, p) {
  const me = lc_(u.username), other = lc_(p['with']);
  const s = sh_('Chat'), h = headers_('Chat'), col = h.indexOf('dibaca') + 1;
  const rows = readAll_('Chat').filter(c => (lc_(c.dari) === me && lc_(c.ke) === other) || (lc_(c.dari) === other && lc_(c.ke) === me));
  rows.filter(c => lc_(c.ke) === me && c.dibaca !== 'Ya').forEach(c => { s.getRange(c._row, col).setValue('Ya'); c.dibaca = 'Ya'; });
  let list = rows.sort((a, b) => String(a.waktu).localeCompare(String(b.waktu)) || a._row - b._row);
  if (p.since) list = list.filter(c => String(c.waktu) >= String(p.since)); // klien membuang duplikat berdasarkan id
  return list.slice(-200).map(c => ({ id: c.id, dariSaya: lc_(c.dari) === me, pesan: c.pesan, waktu: c.waktu, dibaca: c.dibaca === 'Ya' }));
}
function chatSend_(u, p) {
  const to = findUser_(p.to); if (!to) throw new Error('Penerima tidak ditemukan.');
  const pesan = String(p.pesan || '').trim(); if (!pesan) throw new Error('Pesan kosong.');
  if (pesan.length > 2000) throw new Error('Pesan terlalu panjang (maks. 2000 karakter).');
  const cid = String(p._cid || '').replace(/[^\w-]/g, '').slice(0, 60);
  const obj = { id: cid || uid_(), dari: u.username, ke: to.username, pesan: pesan, waktu: now_(), dibaca: 'Tidak' };
  append_('Chat', obj);
  return { id: obj.id, dariSaya: true, pesan: pesan, waktu: obj.waktu, dibaca: false };
}
function chatUnread_(u) {
  const me = lc_(u.username), nm = nameMap_();
  const list = readAll_('Chat').filter(c => lc_(c.ke) === me && c.dibaca !== 'Ya').sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)) || b._row - a._row);
  return { count: list.length, latest: list.slice(0, 5).map(c => ({ id: c.id, dari: c.dari, nama: nm[lc_(c.dari)] || c.dari, pesan: c.pesan, waktu: c.waktu })) };
}

/* ============================================================
 *  PROFIL, PASSWORD, PENGATURAN
 * ============================================================ */
/** Target edit profil: diri sendiri, atau pengguna lain bila Pengembang Aplikasi. */
function targetProfil_(u, p) {
  if (!p.target || lc_(p.target) === lc_(u.username)) return u;
  need_(isDev_(u), 'Anda hanya dapat mengubah profil sendiri.');
  const t = findUser_(p.target); if (!t) throw new Error('Pengguna tidak ditemukan.');
  return t;
}
function profilSave_(u, p) {
  const t = targetProfil_(u, p), self = t._row === u._row;
  const un = lc_(p.username || t.username);
  if (!un || /\s/.test(un)) throw new Error('Username tidak boleh kosong atau mengandung spasi.');
  if (!p.nama) throw new Error('Nama wajib diisi.');
  return lock_(() => {
    const clash = findUser_(un);
    if (clash && clash._row !== t._row) throw new Error('Username "' + un + '" sudah dipakai.');
    const v = k => p[k] !== undefined && p[k] !== null ? String(p[k]) : String(t[k] || '');  // kolom yang tidak dikirim tetap seperti semula
    const kul = v('kuliah') === 'Ya';
    const obj = { username: un, nama: p.nama, nis_nip: v('nis_nip'), asal: v('asal'), asal_sekolah: v('asal_sekolah'),
      jenis_nomor: t.tipe === 'Guru' ? jenisNomor_(p.jenis_nomor || t.jenis_nomor) : '',
      kuliah: kul ? 'Ya' : 'Tidak', kampus: kul ? v('kampus') : '', jurusan: kul ? v('jurusan') : '',
      tahun_masuk: v('tahun_masuk'), kelas_masuk: v('kelas_masuk') };
    ['wa', 'ig', 'nama_ortu', 'bio'].forEach(k => { if (p[k] !== undefined) obj[k] = String(p[k] || '').trim().slice(0, k === 'bio' ? 500 : 100); });
    if (p.privasi !== undefined) obj.privasi = JSON.stringify(Object.assign(bersihPrivasi_(t.privasi), bersihPrivasiSebagian_(p.privasi)));
    update_('Users', t._row, obj);
    if (lc_(t.username) !== un) renameUser_(t.username, un);
    const nu = findUser_(un);
    return self ? { user: pub_(nu), token: makeToken_(nu) } : { user: pub_(nu) };
  });
}

/* ============================================================
 *  PROFIL PENGGUNA + PRIVASI
 *  Kolom yang dapat diatur Publik/Privat (bawaan: Publik). Data privat tidak dapat dilihat
 *  pengguna lain — termasuk Admin — kecuali pemiliknya sendiri dan Pengembang Aplikasi.
 * ============================================================ */
const PRIVASI_KOLOM = ['wa', 'ig', 'nilai', 'iuran', 'kuliah', 'jurusan', 'ortu', 'bio', 'galeri'];
function bersihPrivasi_(v) {
  let o = v; if (typeof v === 'string') { try { o = JSON.parse(v || '{}'); } catch (e) { o = {}; } }
  const r = {}; PRIVASI_KOLOM.forEach(k => r[k] = (o && o[k] === 'privat') ? 'privat' : 'publik'); return r;
}
function bersihPrivasiSebagian_(v) {
  let o = v; if (typeof v === 'string') { try { o = JSON.parse(v || '{}'); } catch (e) { o = {}; } }
  const r = {}; PRIVASI_KOLOM.forEach(k => { if (o && (o[k] === 'privat' || o[k] === 'publik')) r[k] = o[k]; }); return r;
}
function galeriList_(t) { return String(t.galeri || '').split(',').map(x => x.trim()).filter(Boolean); }
/** Ringkasan nilai: tahun ajaran & semester aktif (atau periode terakhir yang ada nilainya). */
function ringkasNilai_(un) {
  const st = settingsMap_();
  const mine = readAll_('Nilai').filter(n => lc_(n.username) === lc_(un));
  if (!mine.length) return null;
  let ta = st.tahun_ajaran, sem = String(st.semester);
  if (!mine.some(n => n.tahun_ajaran === ta && String(n.semester) === sem)) {
    const last = mine.slice().sort((a, b) => (b.tahun_ajaran + b.semester).localeCompare(a.tahun_ajaran + a.semester))[0];
    ta = last.tahun_ajaran; sem = String(last.semester);
  }
  const kelas = mine.find(n => n.tahun_ajaran === ta && String(n.semester) === sem).kelas;
  const per = {};
  readAll_('Nilai').filter(n => n.kelas === kelas && n.tahun_ajaran === ta && String(n.semester) === sem)
    .forEach(n => { const k = lc_(n.username); per[k] = per[k] || { s: 0, c: 0 }; per[k].s += num_(n.nilai); per[k].c++; });
  const avgs = Object.keys(per).map(k => ({ k: k, a: per[k].s / per[k].c })).sort((a, b) => b.a - a.a);
  const idx = avgs.findIndex(x => x.k === lc_(un));
  return { tahun_ajaran: ta, semester: sem, kelas: kelas, rata: Math.round(avgs[idx].a * 100) / 100, peringkat: idx + 1, jumlah: avgs.length, mapel: per[lc_(un)].c };
}
function profilGet_(u, p) {
  const t = findUser_(p.username || u.username); if (!t) throw new Error('Pengguna tidak ditemukan.');
  const self = t._row === u._row, dev = isDev_(u), lihatSemua = self || dev;
  const pv = bersihPrivasi_(t.privasi);
  const boleh = k => lihatSemua || pv[k] !== 'privat';
  const o = { username: t.username, nama: t.nama, tipe: t.tipe, kelas: t.kelas || '', kabag: t.kabag || '', foto: t.foto || '',
    nis_nip: t.nis_nip || '', jenis_nomor: t.tipe === 'Guru' ? jenisNomor_(t.jenis_nomor) : 'NIS', asal: t.asal || '', aktif: t.aktif || 'Ya',
    self: self, bolehEdit: lihatSemua, bolehKelola: perms_(u).users && !self, bolehHapus: dev && !self, privat: [] };
  const isi = (k, fn) => { if (boleh(k)) fn(); else o.privat.push(k); };
  isi('wa', () => o.wa = t.wa || '');
  isi('ig', () => o.ig = t.ig || '');
  isi('kuliah', () => o.kampus = t.kuliah === 'Ya' ? (t.kampus || '') : '');
  isi('jurusan', () => o.jurusan = t.kuliah === 'Ya' ? (t.jurusan || '') : '');
  isi('bio', () => o.bio = t.bio || '');
  isi('galeri', () => o.galeri = galeriList_(t).map(id => ({ id: id, url: 'https://lh3.googleusercontent.com/d/' + id })));
  if (t.tipe === 'Santri') {
    isi('ortu', () => o.nama_ortu = t.nama_ortu || '');
    isi('nilai', () => o.nilai = ringkasNilai_(t.username));
    isi('iuran', () => { const tg = tunggakan_(t.username); const n = tg && tg.iuran ? tg.iuran.jumlahBulan : 0; o.iuran = { lunas: !n, bulan: n }; });
  } else {
    o.mengajar = Array.from(new Set(rosterAll_().filter(r => lc_(r.guru) === lc_(t.username)).map(r => r.kelas))).join(', ');
  }
  if (lihatSemua) { o.privasi = pv; o.edit = { asal_sekolah: t.asal_sekolah || '', kuliah: t.kuliah || 'Tidak', kampus: t.kampus || '', jurusan: t.jurusan || '',
    tahun_masuk: t.tahun_masuk || '', kelas_masuk: t.kelas_masuk || '', wa: t.wa || '', ig: t.ig || '', nama_ortu: t.nama_ortu || '', bio: t.bio || '' }; }
  return o;
}
const GALERI_MAKS = 12;
function galeriAdd_(u, p) {
  const t = targetProfil_(u, p);
  const list = galeriList_(t);
  if (list.length >= GALERI_MAKS) throw new Error('Galeri maksimal ' + GALERI_MAKS + ' foto. Hapus foto lama terlebih dahulu.');
  if (!p.data) throw new Error('Foto kosong.');
  const m = String(p.data).match(/^data:(image\/[a-z]+);base64,/);
  const bytes = Utilities.base64Decode(String(p.data).replace(/^data:[^,]+,/, ''));
  if (bytes.length > 3 * 1024 * 1024) throw new Error('Ukuran foto maksimal 3 MB.');
  const mime = m ? m[1] : 'image/jpeg';
  const file = folder_().createFile(Utilities.newBlob(bytes, mime, 'galeri_' + t.username + '_' + Date.now() + (mime === 'image/png' ? '.png' : '.jpg')));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return lock_(() => {
    const fresh = findUser_(t.username);
    const l = galeriList_(fresh); l.push(file.getId());
    update_('Users', fresh._row, { galeri: l.join(',') });
    return { id: file.getId(), url: 'https://lh3.googleusercontent.com/d/' + file.getId(), jumlah: l.length };
  });
}
function galeriDelete_(u, p) {
  const t = targetProfil_(u, p);
  return lock_(() => {
    const fresh = findUser_(t.username);
    const l = galeriList_(fresh).filter(x => x !== p.id);
    update_('Users', fresh._row, { galeri: l.join(',') });
    try { DriveApp.getFileById(p.id).setTrashed(true); } catch (e) {}
    return { jumlah: l.length };
  });
}
function folder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder(APP_FOLDER);
  p.setProperty('FOLDER_ID', f.getId());
  return f;
}
function profilPhoto_(u, p) {
  u = targetProfil_(u, p);
  if (!p.data) throw new Error('Foto kosong.');
  const bytes = Utilities.base64Decode(String(p.data).replace(/^data:[^,]+,/, ''));
  if (bytes.length > 2 * 1024 * 1024) throw new Error('Ukuran foto maksimal 2 MB.');
  const file = folder_().createFile(Utilities.newBlob(bytes, p.mime || 'image/jpeg', 'foto_' + u.username + '_' + Date.now() + '.jpg'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const old = String(u.foto || '').match(/\/d\/([-\w]{20,})/);
  if (old) { try { DriveApp.getFileById(old[1]).setTrashed(true); } catch (e) {} }
  const url = 'https://lh3.googleusercontent.com/d/' + file.getId();
  update_('Users', u._row, { foto: url });
  return { foto: url };
}
function profilPassword_(u, p) {
  if (!checkPw_(u.password, p.lama)) throw new Error('Kata sandi lama salah.');
  if (!p.baru || String(p.baru).length < 6) throw new Error('Kata sandi baru minimal 6 karakter.');
  if (p.baru !== p.ulang) throw new Error('Ulangi kata sandi baru tidak cocok.');
  return lock_(() => {
    const h = hashPw_(String(p.baru));
    update_('Users', u._row, { password: h });
    u.password = h;
    return { token: makeToken_(u) };
  });
}
function settingsAll_(u) {
  need_(perms_(u).settings);
  const m = settingsMap_();
  return DEFAULT_SETTINGS.map(r => ({ kunci: r[0], nilai: m[r[0]] || '', keterangan: r[2], devOnly: SETTINGS_DEV_ONLY.indexOf(r[0]) >= 0,
    pilihan: r[0].indexOf('jenis_no_') === 0 ? JENIS_NOMOR : null }));
}
function settingsSave_(u, p) {
  need_(perms_(u).settings);
  return lock_(() => {
    const rows = readAll_('Pengaturan');
    Object.keys(p.values || {}).forEach(k => {
      if (!DEFAULT_SETTINGS.some(r => r[0] === k)) return;
      if (SETTINGS_DEV_ONLY.indexOf(k) >= 0 && !isDev_(u)) return;
      if (k.indexOf('jenis_no_') === 0) p.values[k] = jenisNomor_(p.values[k]);
      const r = rows.find(x => x.kunci === k);
      if (r) { if (r.nilai !== String(p.values[k])) update_('Pengaturan', r._row, { nilai: p.values[k] }); }
      else append_('Pengaturan', { kunci: k, nilai: p.values[k], keterangan: '' });
    });
    delete MEMO._settings;
    return true;
  });
}

/* ============================================================
 *  LOGO — dapat diunggah / diganti oleh Pengembang Aplikasi
 *  jenis: dayah (login, ikon di aplikasi, kop Salafi & keuangan), wustha, ulya (kop raport PDF)
 * ============================================================ */
const LOGO_KEYS = { dayah: 'logo_dayah', wustha: 'logo_wustha', ulya: 'logo_ulya' };
function logoGet_(u) {
  const s = settingsMap_();
  const o = {};
  Object.keys(LOGO_KEYS).forEach(j => { o[j] = s[LOGO_KEYS[j]] ? (fileData_(s[LOGO_KEYS[j]]) || driveImg_(s[LOGO_KEYS[j]])) : ''; });
  o.bawaan = defaultLogo_();
  o.bolehUbah = isDev_(u);
  return o;
}
function setSettingVal_(k, v) {
  const r = readAll_('Pengaturan').find(x => x.kunci === k);
  if (r) update_('Pengaturan', r._row, { nilai: v }); else append_('Pengaturan', { kunci: k, nilai: v, keterangan: '' });
  delete MEMO._settings;
}
function logoUpload_(u, p) {
  need_(isDev_(u), 'Hanya Pengembang Aplikasi yang dapat mengganti logo.');
  const key = LOGO_KEYS[p.jenis]; if (!key) throw new Error('Jenis logo tidak dikenal.');
  if (!p.data) throw new Error('Gambar kosong.');
  const m = String(p.data).match(/^data:(image\/(png|jpeg|jpg|webp));base64,/);
  const mime = m ? m[1] : 'image/png';
  const bytes = Utilities.base64Decode(String(p.data).replace(/^data:[^,]+,/, ''));
  if (bytes.length > 3 * 1024 * 1024) throw new Error('Ukuran logo maksimal 3 MB.');
  const file = folder_().createFile(Utilities.newBlob(bytes, mime, 'logo_' + p.jenis + '_' + Date.now() + (mime === 'image/png' ? '.png' : '.jpg')));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const old = driveId_(getSetting_(key));
  return lock_(() => {
    setSettingVal_(key, file.getId());
    if (old) { try { DriveApp.getFileById(old).setTrashed(true); } catch (e) {} }
    return logoGet_(u);
  });
}
function logoReset_(u, p) {
  need_(isDev_(u), 'Hanya Pengembang Aplikasi yang dapat mengganti logo.');
  const key = LOGO_KEYS[p.jenis]; if (!key) throw new Error('Jenis logo tidak dikenal.');
  return lock_(() => { setSettingVal_(key, ''); return logoGet_(u); });
}

/* ============================================================
 *  GAMBAR (logo) & PDF
 * ============================================================ */
function driveId_(v) { const m = String(v || '').match(/[-\w]{25,}/); return m ? m[0] : ''; }
function driveImg_(v) {
  if (!v) return '';
  const id = driveId_(v);
  return id ? 'https://lh3.googleusercontent.com/d/' + id : String(v);
}
function defaultLogo_() { return typeof DEFAULT_LOGO === 'string' ? DEFAULT_LOGO : ''; }
/** Gambar dari Drive/URL sebagai data URI (di-cache). Kosong bila gagal. */
function fileData_(v) {
  if (!v) return '';
  const cache = CacheService.getScriptCache();
  const ck = 'img_' + (driveId_(v) || String(v).slice(-60));
  const c = cache.get(ck); if (c) return c;
  try {
    const id = driveId_(v);
    const blob = id ? DriveApp.getFileById(id).getBlob() : UrlFetchApp.fetch(v).getBlob();
    const data = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    if (data.length < 95000) cache.put(ck, data, 21600);
    return data;
  } catch (e) { return ''; }
}
function logoData_(key) {
  return fileData_(getSetting_(key)) || fileData_(getSetting_('logo_dayah')) || defaultLogo_();
}
function esc_(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function rp_(n) { return 'Rp ' + Math.round(num_(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function tglIndo_(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? (Number(m[3]) + ' ' + BULAN[Number(m[2]) - 1] + ' ' + m[1]) : (s || '-');
}
function pdfCss_() {
  return '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111;margin:0}' +
    '.kop{width:100%;border-bottom:3px double #0f6e4f;padding-bottom:6px;margin-bottom:14px}.kop td{vertical-align:middle}' +
    '.kop .t1{font-size:11pt;font-weight:bold}.kop .t2{font-size:15pt;font-weight:bold;color:#0f6e4f}.kop .t3{font-size:9pt}' +
    'h3{text-align:center;margin:6px 0 2px;font-size:12.5pt}.sub{text-align:center;margin-bottom:12px}' +
    '.info td{padding:2px 6px 2px 0}.tbl{width:100%;border-collapse:collapse;margin-top:8px}.tbl th{background:#0f6e4f;color:#fff;padding:6px;border:1px solid #0f6e4f;font-size:10pt}' +
    '.tbl td{border:1px solid #999;padding:5px 6px;font-size:10pt}.c{text-align:center}.r{text-align:right}.tot td{font-weight:bold;background:#eef7f2}' +
    '.ttd{width:100%;margin-top:28px}.ttd td{vertical-align:top;text-align:center;width:50%}.nm{font-weight:bold;text-decoration:underline}</style>';
}
function kop_(judul, logoKey) {
  const s = settingsMap_(), logo = logoData_(logoKey);
  return '<table class="kop"><tr><td style="width:80px">' + (logo ? '<img src="' + logo + '" style="width:72px;height:72px">' : '') + '</td>' +
    '<td style="text-align:center"><div class="t1">YAYASAN PENDIDIKAN ISLAM</div><div class="t2">' + esc_(judul) + '</div>' +
    '<div class="t3">' + esc_(s.alamat) + '</div><div class="t3">Email : ' + esc_(s.email) + '</div></td><td style="width:80px"></td></tr></table>';
}
function toPdf_(html, name) {
  const blob = Utilities.newBlob('<html><head><meta charset="utf-8">' + pdfCss_() + '</head><body>' + html + '</body></html>', 'text/html', name + '.html').getAs('application/pdf');
  return { name: name + '.pdf', base64: Utilities.base64Encode(blob.getBytes()) };
}
function raportPdf_(u, p) {
  const d = raportData_(u, p), s = settingsMap_();
  const j = d.jenjang;
  const judul = j === 'Wustha' ? 'PDF WUSTHA ALHUDA MALIKUSSALEH' : j === 'Ulya' ? 'PDF ULYA ALHUDA MALIKUSSALEH' : (s.nama_dayah || 'DAYAH AL-HUDA MALIKUSSALEH');
  const logoKey = j === 'Wustha' ? 'logo_wustha' : j === 'Ulya' ? 'logo_ulya' : 'logo_dayah';
  let h = kop_(judul, logoKey);
  h += '<h3>LAPORAN HASIL PENILAIAN AKADEMIK SANTRI</h3><div class="sub">Semester ' + esc_(d.semester) + ' / Tahun Ajaran ' + esc_(d.tahun_ajaran) + '</div>';
  h += '<table class="info"><tr><td>Nama Santri</td><td>: <b>' + esc_(d.santri.nama) + '</b></td></tr><tr><td>NIS</td><td>: ' + esc_(d.santri.nis || '-') + '</td></tr>' +
    '<tr><td>Kelas</td><td>: ' + esc_(d.santri.kelas) + '</td></tr></table>';
  h += '<table class="tbl"><tr><th style="width:30px">No</th><th>Mata Pelajaran</th><th style="width:55px">Nilai</th><th style="width:120px">Predikat</th><th style="width:100px">Keterangan</th></tr>';
  if (!d.items.length) h += '<tr><td colspan="5" class="c">Belum ada nilai</td></tr>';
  d.items.forEach((it, i) => { h += '<tr><td class="c">' + (i + 1) + '</td><td>' + esc_(it.mapel) + '</td><td class="c">' + it.nilai + '</td><td class="c">' + esc_(it.predikat) + '</td><td class="c">' + it.keterangan + '</td></tr>'; });
  h += '<tr class="tot"><td colspan="2">Rata - Rata Nilai</td><td class="c">' + d.rata + '</td><td colspan="2" class="c">' + predikat_(d.rata) + '</td></tr>';
  h += '<tr class="tot"><td colspan="2">Peringkat</td><td colspan="3">' + d.peringkat + ' dari ' + d.jumlahSantri + ' santri</td></tr>';
  if (d.semester === '2') h += '<tr class="tot"><td colspan="2">Naik Kelas</td><td colspan="3">' + esc_(d.naik_kelas || '-') + '</td></tr>';
  h += '</table>';
  let kanan;
  if (j === 'Salafi') {
    const id = idPejabat_(s.pimpinan_dayah, s.jenis_no_pimpinan, s.nip_pimpinan);
    kanan = 'Pimpinan Dayah,<br>' + esc_(s.nama_dayah ? toTitle_(s.nama_dayah) : 'Dayah Al-Huda Malikussaleh') + ',<br><br><br><br><span class="nm">' + esc_(s.pimpinan_dayah) + '</span><br>' + id;
  } else {
    const W = j === 'Wustha';
    const nmK = W ? s.kepala_wustha : s.kepala_ulya;
    const id = idPejabat_(nmK, W ? s.jenis_no_kepala_wustha : s.jenis_no_kepala_ulya, W ? s.nip_kepala_wustha : s.nip_kepala_ulya);
    kanan = 'Ketua PDF ' + j + ',<br>PDF ' + j + ' Alhuda Malikussaleh,<br><br><br><br><span class="nm">' + esc_(nmK) + '</span><br>' + id;
  }
  const idWali = d.wali ? idLine_(d.waliJenis, d.waliNomor) : idLine_('NIP', '');
  h += '<table class="ttd"><tr><td>Mengetahui,<br>Wali Kelas ' + esc_(d.santri.kelas) + '<br><br><br><br><span class="nm">' + esc_(d.wali || '........................') + '</span><br>' + idWali + '</td><td>' + kanan + '</td></tr></table>';
  return toPdf_(h, 'Raport_' + d.santri.nama.replace(/\W+/g, '_') + '_S' + d.semester + '_' + d.tahun_ajaran.replace('/', '-'));
}
/** Baris nomor identitas di bawah nama, mis. "NUPTK : 1234" atau "NIP : -". */
function idLine_(jenis, nomor) { const n = String(nomor || '').trim(); return esc_(jenisNomor_(jenis)) + ' : ' + esc_(n && n !== '-' ? n : '-'); }
/** Pejabat dari Pengaturan; bila nomornya kosong, coba ambil dari akun guru dengan nama yang sama. */
function idPejabat_(nama, jenis, nomor) {
  const n = String(nomor || '').trim();
  if (n && n !== '-') return idLine_(jenis, n);
  const norm = x => lc_(x).replace(/[^a-z]/g, '');
  const g = guruAll_().find(x => norm(x.nama) === norm(nama) || (norm(nama).indexOf(norm(String(x.nama).split(',')[0])) >= 0 && norm(String(x.nama).split(',')[0]).length > 6));
  return g && g.nis_nip ? idLine_(g.jenis_nomor || jenis, g.nis_nip) : idLine_(jenis, '');
}
function toTitle_(s) { return String(s).toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase()); }
function ttdBendahara_() {
  const s = settingsMap_();
  return '<table class="ttd"><tr><td></td><td>' + tglIndo_(today_()) + '<br>Bendahara Dayah,<br><br><br><br><span class="nm">' + esc_(s.bendahara) + '</span></td></tr></table>';
}
function iuranPdf_(u, p) {
  const d = iuranGet_(u, p), s = settingsMap_();
  let h = kop_(s.nama_dayah || 'DAYAH AL-HUDA MALIKUSSALEH', 'logo_dayah');
  h += '<h3>LAPORAN PEMBAYARAN IURAN BULANAN</h3><div class="sub">Tahun ' + d.tahun + '</div>';
  h += '<table class="info"><tr><td>Nama Santri</td><td>: <b>' + esc_(d.santri.nama) + '</b></td></tr><tr><td>Kelas</td><td>: ' + esc_(d.santri.kelas) + '</td></tr><tr><td>Iuran / bulan</td><td>: ' + rp_(d.nominal) + '</td></tr></table>';
  h += '<table class="tbl"><tr><th>No</th><th>Bulan</th><th>Tanggal Bayar</th><th>Jumlah</th><th>Status</th></tr>';
  d.bulan.forEach((b, i) => { h += '<tr><td class="c">' + (i + 1) + '</td><td>' + b.nama + '</td><td class="c">' + (b.tanggal ? tglIndo_(b.tanggal) : '-') + '</td><td class="r">' + (b.jumlah ? rp_(b.jumlah) : '-') + '</td><td class="c">' + (b.lunas ? 'Lunas' : (b.jumlah ? 'Kurang' : 'Belum')) + '</td></tr>'; });
  h += '<tr class="tot"><td colspan="3">Total Dibayar (' + d.lunas + ' bulan lunas)</td><td class="r">' + rp_(d.totalBayar) + '</td><td></td></tr></table>';
  h += ttdBendahara_();
  return toPdf_(h, 'Iuran_' + d.santri.nama.replace(/\W+/g, '_') + '_' + d.tahun);
}
function tahunanPdf_(u, p) {
  const d = tahunanGet_(u, p), s = settingsMap_();
  let h = kop_(s.nama_dayah || 'DAYAH AL-HUDA MALIKUSSALEH', 'logo_dayah');
  h += '<h3>LAPORAN PEMBAYARAN UANG TAHUNAN</h3><div class="sub">Tahun Ajaran ' + esc_(d.tahun_ajaran) + '</div>';
  h += '<table class="info"><tr><td>Nama Santri</td><td>: <b>' + esc_(d.santri.nama) + '</b></td></tr><tr><td>Kelas</td><td>: ' + esc_(d.santri.kelas) + '</td></tr><tr><td>Uang Tahunan</td><td>: ' + rp_(d.nominal) + '</td></tr></table>';
  h += '<table class="tbl"><tr><th>No</th><th>Tanggal</th><th>Keterangan</th><th>Jumlah</th></tr>';
  if (!d.items.length) h += '<tr><td colspan="4" class="c">Belum ada pembayaran</td></tr>';
  d.items.forEach((b, i) => { h += '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + tglIndo_(b.tanggal) + '</td><td>' + esc_(b.keterangan || 'Pembayaran') + '</td><td class="r">' + rp_(b.jumlah) + '</td></tr>'; });
  h += '<tr class="tot"><td colspan="3">Total Dibayar</td><td class="r">' + rp_(d.total) + '</td></tr><tr class="tot"><td colspan="3">Sisa</td><td class="r">' + rp_(d.sisa) + '</td></tr>';
  h += '<tr class="tot"><td colspan="3">Status</td><td class="r">' + (d.lunas ? 'LUNAS' : 'BELUM LUNAS') + '</td></tr></table>';
  h += ttdBendahara_();
  return toPdf_(h, 'UangTahunan_' + d.santri.nama.replace(/\W+/g, '_') + '_' + d.tahun_ajaran.replace('/', '-'));
}
