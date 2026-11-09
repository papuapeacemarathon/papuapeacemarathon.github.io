# Tutorial: Menampilkan Postingan Instagram Resmi di Website

Akun sumber: **[@officialpapuapeacemarathon](https://www.instagram.com/officialpapuapeacemarathon)**

Dokumen ini menjelaskan cara "meng-clone" (menyalin dan menampilkan) postingan dari akun Instagram resmi
Papua Peace Marathon ke website, mulai dari cara paling sederhana sampai yang otomatis penuh.

> **Penting:** gunakan hanya cara resmi di bawah ini. Jangan memakai scraper/bot yang mengambil data
> langsung dari halaman instagram.com. Cara itu melanggar Ketentuan Penggunaan Instagram, mudah rusak,
> dan bisa membuat akun resmi terkena pembatasan.

---

## Pilih cara yang sesuai

| Cara | Otomatis? | Butuh token/API? | Cocok untuk |
|---|---|---|---|
| [1. Embed per postingan](#1-embed-per-postingan-paling-mudah) | Tidak, tempel manual | Tidak | 3–6 postingan pilihan |
| [2. Instagram API (feed otomatis)](#2-feed-otomatis-dengan-instagram-api) | Ya | Ya | Galeri yang selalu ter-update |
| [3. Widget pihak ketiga](#3-widget-pihak-ketiga-tanpa-coding) | Ya | Tidak (login di layanan) | Cepat tanpa coding |
| [4. Salin manual (unduh foto + caption)](#4-salin-manual-unduh-foto--caption) | Tidak | Tidak | Konten yang ingin di-desain ulang |

Rekomendasi: mulai dengan **Cara 1** untuk peluncuran, lalu pindah ke **Cara 2** jika galeri perlu ter-update sendiri.

---

## 1. Embed per postingan (paling mudah)

Instagram menyediakan kode embed resmi untuk setiap postingan publik.

### Langkah

1. Buka postingan di **instagram.com** (versi web/desktop).
2. Klik ikon **⋯** (titik tiga) di pojok kanan atas postingan → **Sematkan / Embed**.
3. Centang/hapus centang **Sertakan keterangan (caption)** sesuai kebutuhan.
4. Klik **Salin kode sematan / Copy embed code**.
5. Tempel kode tersebut ke `index.html` di section yang diinginkan.

### Contoh section galeri

Kode embed Instagram berupa `<blockquote class="instagram-media" …>`. Cukup simpan **URL postingan** saja,
lalu biarkan `embed.js` milik Instagram yang merender:

```html
<!-- ================= INSTAGRAM ================= -->
<section id="instagram" class="relative bg-cream py-24 text-forest md:py-32">
  <div class="mx-auto max-w-7xl px-5">
    <p class="eyebrow text-emerald2">Instagram</p>
    <h2 class="display mt-5 text-[clamp(2rem,6vw,4rem)] text-wine">@officialpapuapeacemarathon</h2>

    <div class="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- ganti dengan URL postingan asli -->
      <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/KODE_POSTINGAN_1/" data-instgrm-version="14"></blockquote>
      <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/KODE_POSTINGAN_2/" data-instgrm-version="14"></blockquote>
      <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/KODE_POSTINGAN_3/" data-instgrm-version="14"></blockquote>
    </div>

    <a href="https://www.instagram.com/officialpapuapeacemarathon" target="_blank" rel="noopener noreferrer"
       class="mt-12 inline-flex items-center gap-3 rounded-full bg-wine px-8 py-4 text-xs font-bold uppercase tracking-widest text-cream">
      Ikuti di Instagram
    </a>
  </div>
</section>

<!-- cukup sekali, sebelum </body> -->
<script async src="https://www.instagram.com/embed.js"></script>
```

### Catatan

- Postingan harus dari akun **publik**.
- Untuk Reels gunakan URL `https://www.instagram.com/reel/KODE/`.
- Jika section dirender oleh Alpine (`x-for`), panggil `window.instgrm?.Embeds.process()` setelah
  elemen muncul agar embed diproses ulang.
- Embed memuat skrip dan iframe dari Instagram, jadi lebih berat. Batasi 3–6 postingan per halaman.

---

## 2. Feed otomatis dengan Instagram API

Cara ini mengambil postingan terbaru secara otomatis lewat **Instagram API with Instagram Login**
(API resmi Meta). *Instagram Basic Display API* yang lama sudah dihentikan Meta sejak Desember 2024,
jadi jangan ikuti tutorial lama yang memakainya.

### Prasyarat

- Akun **@officialpapuapeacemarathon** sudah diubah menjadi **akun Profesional**
  (Bisnis atau Kreator): *Pengaturan → Jenis akun dan alat → Beralih ke akun profesional*.
- Akun developer di **[developers.facebook.com](https://developers.facebook.com)**.

### Langkah A — Buat aplikasi Meta dan token

1. Masuk ke **developers.facebook.com → My Apps → Create App**.
2. Pilih use case yang berkaitan dengan **Instagram** (mengelola konten Instagram), lalu tipe **Business**.
3. Di dasbor aplikasi, buka **Instagram → API setup with Instagram login**.
4. Pada bagian **Generate access tokens**, klik **Add account**, lalu login dengan akun
   @officialpapuapeacemarathon dan setujui izin **`instagram_business_basic`**.
5. Klik **Generate token**. Simpan token ini dengan aman: ini **token jangka panjang (berlaku ±60 hari)**.

> Menu di dasbor Meta kadang berubah nama. Jika berbeda, cari bagian "Instagram API with Instagram Login"
> di dokumentasi resmi: https://developers.facebook.com/docs/instagram-platform

### Langkah B — Uji panggilan API

```bash
curl "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=TOKEN_ANDA"
```

Hasilnya berupa JSON berisi daftar postingan terbaru (`IMAGE`, `VIDEO`, atau `CAROUSEL_ALBUM`).

### Langkah C — Jangan taruh token di browser

Website ini statis (HTML + JS). **Token tidak boleh ditulis di `js/app.js`**, karena siapa pun bisa
melihatnya dan memakai akun resmi. Solusinya: ambil data di sisi server secara terjadwal, simpan sebagai
file JSON + gambar, lalu website hanya membaca file tersebut.

Selain itu, `media_url` dari Instagram **kedaluwarsa** setelah beberapa waktu. Jadi gambar sebaiknya
diunduh dan disimpan di repositori, bukan di-link langsung.

#### Skrip pengambil data — `scripts/fetch-instagram.mjs`

```js
// Ambil 12 postingan terbaru → data/instagram.json + img/instagram/*.jpg
// Jalankan: IG_TOKEN=xxxx node scripts/fetch-instagram.mjs
import fs from 'node:fs/promises';

const TOKEN = process.env.IG_TOKEN;
if (!TOKEN) throw new Error('IG_TOKEN belum di-set');

const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const res = await fetch(`https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${TOKEN}`);
if (!res.ok) throw new Error(`Instagram API ${res.status}: ${await res.text()}`);
const { data } = await res.json();

await fs.mkdir('img/instagram', { recursive: true });
const posts = [];
for (const p of data) {
  const src = p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url;
  if (!src) continue;
  const file = `img/instagram/${p.id}.jpg`;
  await fs.writeFile(file, Buffer.from(await (await fetch(src)).arrayBuffer()));
  posts.push({
    id: p.id,
    image: `./${file}`,
    caption: (p.caption || '').slice(0, 220),
    link: p.permalink,
    type: p.media_type,
    date: p.timestamp,
  });
}
await fs.writeFile('data/instagram.json', JSON.stringify(posts, null, 2));
console.log(`Tersimpan ${posts.length} postingan`);
```

#### Perbarui token sebelum kedaluwarsa (±60 hari)

```bash
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN_ANDA"
```

Respons berisi `access_token` baru. Simpan ke secret (lihat Langkah D). Token hanya bisa diperbarui jika
umurnya minimal 24 jam dan belum kedaluwarsa.

### Langkah D — Jalankan otomatis tiap hari (GitHub Actions)

1. Di GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**,
   nama `IG_TOKEN`, isi token dari Langkah A.
2. Buat file `.github/workflows/instagram.yml`:

```yaml
name: Sinkron Instagram
on:
  schedule:
    - cron: '0 22 * * *'   # tiap hari 07.00 WIT
  workflow_dispatch:        # bisa dijalankan manual
permissions:
  contents: write
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node scripts/fetch-instagram.mjs
        env: { IG_TOKEN: '${{ secrets.IG_TOKEN }}' }
      - run: |
          git config user.name  "instagram-bot"
          git config user.email "actions@users.noreply.github.com"
          git add data/instagram.json img/instagram
          git diff --cached --quiet || git commit -m "Sinkron postingan Instagram"
          git push
```

Setiap commit baru akan ikut ter-deploy jika hosting (mis. Cloudflare Pages) terhubung ke repo.

### Langkah E — Tampilkan di website

Tambahkan ke `js/app.js` (di dalam objek `site()`):

```js
igPosts: [],
async loadInstagram() {
  try {
    const r = await fetch('./data/instagram.json', { cache: 'no-cache' });
    if (r.ok) this.igPosts = (await r.json()).slice(0, 6);
  } catch (_) { /* galeri disembunyikan jika gagal */ }
},
```

Panggil `this.loadInstagram();` di fungsi `init()`. Lalu markup galerinya:

```html
<section id="instagram" class="relative bg-cream py-24 text-forest md:py-32" x-show="igPosts.length">
  <div class="mx-auto max-w-7xl px-5">
    <p class="eyebrow text-emerald2">Instagram</p>
    <h2 class="display mt-5 text-[clamp(2rem,6vw,4rem)] text-wine">Kabar Terbaru</h2>

    <div class="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3">
      <template x-for="p in igPosts" :key="p.id">
        <a :href="p.link" target="_blank" rel="noopener noreferrer"
           class="group relative block aspect-square overflow-hidden rounded-2xl bg-sand">
          <img :src="p.image" :alt="p.caption || 'Postingan Instagram'" loading="lazy"
               class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
          <span class="absolute inset-0 flex items-end bg-gradient-to-t from-forest/80 to-transparent p-4 text-sm text-cream opacity-0 transition group-hover:opacity-100"
                x-text="p.caption"></span>
        </a>
      </template>
    </div>
  </div>
</section>
```

---

## 3. Widget pihak ketiga (tanpa coding)

Layanan seperti **Behold**, **LightWidget**, **SnapWidget**, atau **Elfsight** memakai API resmi di belakang
layar dan mengurus token secara otomatis.

1. Daftar di salah satu layanan, lalu hubungkan akun @officialpapuapeacemarathon.
2. Atur tampilan (grid, jumlah postingan, warna). Gunakan warna brand: hijau `#0E2A21`, emas `#FFC800`, krem `#F3EBD8`.
3. Salin kode widget (biasanya `<script>` atau `<iframe>`) dan tempel di section yang diinginkan.

Kekurangan: paket gratis biasanya terbatas (jumlah postingan, frekuensi update, atau ada watermark),
dan tampilan tidak sepenuhnya bisa disesuaikan.

---

## 4. Salin manual (unduh foto + caption)

Cocok untuk konten pilihan yang ingin ditampilkan dengan desain website sendiri (bukan tampilan Instagram).

1. Ambil **file asli** dari tim media/desainer, atau unduh arsip lengkap akun:
   *Pengaturan → Pusat Akun → Informasi Anda dan izin → Unduh informasi Anda*. Pilih format **JSON**
   agar caption dan tanggal ikut terunduh.
2. Kompres gambar (mis. ke lebar 1080 px, format `.jpg`/`.webp`) dan simpan di `img/instagram/`.
3. Salin caption ke data di `js/app.js` atau `data/instagram.json` dengan format yang sama seperti
   pada Cara 2. Markup galeri Cara 2 bisa langsung dipakai.
4. Selalu cantumkan tautan ke postingan aslinya.

---

## Checklist sebelum publikasi

- [ ] Akun Instagram publik (dan Profesional jika memakai Cara 2).
- [ ] Token **tidak** ada di file yang ter-deploy ke browser.
- [ ] Gambar disimpan lokal (Cara 2 & 4), bukan link `media_url` yang bisa kedaluwarsa.
- [ ] Setiap item menautkan ke postingan asli di Instagram.
- [ ] Teks `alt` diisi dari caption untuk aksesibilitas.
- [ ] Ikon Instagram di footer mengarah ke `https://www.instagram.com/officialpapuapeacemarathon`.
- [ ] Untuk Cara 2: jadwalkan pengingat refresh token tiap ±50 hari (atau otomatiskan di workflow).
