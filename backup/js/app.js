/* =========================================================
   Papua Peace Run 2027 — logika halaman (Alpine.js)
   Dimuat (defer) sebelum Alpine agar site() & routeSim() sudah tersedia.
   ========================================================= */

/* ====== Simulasi jalur lari (Leaflet + OpenStreetMap, tanpa API key) ======
   Data rute ada di ./data/routes.js. Objek Leaflet disimpan di luar state Alpine
   agar tidak dibungkus Proxy reaktif. */
const RM = { map: null, group: null, runner: null, done: null, pts: [], cum: [], raf: 0 };

function routeSim() {
  const hav = (a, b) => {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
    return 12742017.6 * Math.asin(Math.sqrt(h));
  };
  const icon = (cls, html, size = 30) => L.divIcon({ className: '', html: `<div class="${cls}">${html}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

  return {
    keys: ['5K', '10K', '21K', '42K'],
    sel: '42K',
    playing: false,
    progress: 0,
    total: 0,
    pace: 6,
    paces: [4.5, 5, 5.5, 6, 6.5, 7, 8, 9, 10],
    zone: 'Garis start',

    meta: {
      '5K':  { start: 'Holtekamp (area finis)',        turn: 'Jl. Pantai Holtekamp (arah Hamadi)', cot: '1 jam',   pace: 8,
               desc: 'Putaran keluarga di jalur pesisir Holtekamp — datar, dekat area finis.' },
      '10K': { start: 'Pantai Hamadi',                 turn: 'Jl. Holtekamp – Skouw',              cot: '2 jam',   pace: 7,
               desc: 'Dari Hamadi melintasi Jembatan Youtefa menuju garis finis di Holtekamp.' },
      '21K': { start: 'Taman Imbi, pusat kota Jayapura', turn: 'Pantai Holtekamp timur',            cot: '3,5 jam', pace: 6.5,
               desc: 'Dari jantung kota menyusuri Teluk Youtefa dan jembatan ikonik Papua.' },
      '42K': { start: 'Taman Imbi, pusat kota Jayapura', turn: 'Koya Timur, Muara Tami',            cot: '6,5 jam', pace: 6,
               desc: 'Maraton penuh: kota, teluk, jembatan, hingga dataran terbuka Muara Tami.' },
    },
    info() { return this.meta[this.sel]; },

    boot() {
      // Muat peta hanya saat section mendekati layar
      const io = new IntersectionObserver((es) => {
        if (!es.some(e => e.isIntersecting)) return;
        io.disconnect();
        this.initMap();
      }, { rootMargin: '300px' });
      io.observe(this.$refs.map);
    },

    initMap() {
      if (!window.L || !window.RACE_ROUTES) return;
      RM.map = L.map(this.$refs.map, {
        scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false, zoomControl: true,
      }).setView([-2.6, 140.75], 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // Server produksi (Cloudflare) mengirim `Referrer-Policy: same-origin`, sehingga tile tidak
        // membawa Referer dan diblokir OSM ("Access blocked"). Kirim origin situs khusus untuk tile.
        referrerPolicy: 'strict-origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(RM.map);
      // Klik peta untuk mengaktifkan zoom dengan scroll
      RM.map.on('click', () => RM.map.scrollWheelZoom.enable());
      RM.map.on('mouseout', () => RM.map.scrollWheelZoom.disable());
      this.draw();
    },

    select(k, scroll = false) {
      this.sel = k;
      this.pace = this.meta[k].pace;
      if (scroll) document.getElementById('peta-rute')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (RM.map) this.draw();
    },

    draw() {
      this.stop();
      const r = window.RACE_ROUTES[this.sel];
      RM.pts = r.path;
      RM.cum = [0];
      for (let i = 1; i < RM.pts.length; i++) RM.cum.push(RM.cum[i - 1] + hav(RM.pts[i - 1], RM.pts[i]));
      this.total = RM.cum[RM.cum.length - 1];

      if (RM.group) RM.group.remove();
      const g = RM.group = L.featureGroup().addTo(RM.map);
      L.polyline(RM.pts, { color: '#0E2A21', weight: 9, opacity: .25 }).addTo(g);
      L.polyline(RM.pts, { color: '#2E8B6E', weight: 5, opacity: .9 }).addTo(g);
      RM.done = L.polyline([], { color: '#F2C230', weight: 5 }).addTo(g);

      // Penanda kilometer & pos air (simulasi tiap 2,5 km)
      const step = this.total > 12000 ? 5000 : 1000;
      for (let d = step; d < this.total - 200; d += step)
        L.marker(this.pointAt(d), { icon: icon('rm-km', d / 1000, 22), interactive: false, keyboard: false }).addTo(g);
      for (let d = 2500; d < this.total - 200; d += 2500) if (d % step)
        L.marker(this.pointAt(d), { icon: icon('rm-water', '<i class="fa-solid fa-droplet"></i>', 14), keyboard: false })
          .bindTooltip(`Pos air · km ${(d / 1000).toLocaleString('id-ID')}`).addTo(g);

      const m = this.info();
      L.marker(RM.pts[0], { icon: icon('rm-pin rm-start', '<i class="fa-solid fa-play"></i>'), zIndexOffset: 900 })
        .bindTooltip(`<b>Start ${this.sel}</b><br>${m.start}`).addTo(g);
      if (r.turn) L.marker(r.turn, { icon: icon('rm-pin rm-turn', '<i class="fa-solid fa-rotate-left"></i>', 24), zIndexOffset: 800 })
        .bindTooltip(`<b>Putar balik</b><br>${m.turn}`).addTo(g);
      L.marker(RM.pts[RM.pts.length - 1], { icon: icon('rm-pin rm-finish', '<i class="fa-solid fa-flag-checkered"></i>'), zIndexOffset: 1000 })
        .bindTooltip('<b>Garis Finis</b><br>Holtekamp · Vtekya Restaurant').addTo(g);
      RM.runner = L.marker(RM.pts[0], { icon: icon('rm-runner', '', 20), zIndexOffset: 2000, interactive: false }).addTo(g);

      RM.map.fitBounds(g.getBounds(), { padding: [30, 30] });
      this.seek(0);
    },

    pointAt(d) {
      const c = RM.cum, p = RM.pts;
      let lo = 0, hi = c.length - 1;
      while (lo < hi - 1) { const mid = (lo + hi) >> 1; (c[mid] <= d ? lo = mid : hi = mid); }
      const t = c[hi] > c[lo] ? (d - c[lo]) / (c[hi] - c[lo]) : 0;
      return [p[lo][0] + (p[hi][0] - p[lo][0]) * t, p[lo][1] + (p[hi][1] - p[lo][1]) * t];
    },

    seek(f) {
      this.progress = Math.max(0, Math.min(1, f));
      if (!RM.runner) return;
      const d = this.progress * this.total, pos = this.pointAt(d);
      RM.runner.setLatLng(pos);
      const i = RM.cum.findIndex(c => c > d);
      RM.done.setLatLngs([...RM.pts.slice(0, i < 0 ? RM.pts.length : i), pos]);
      this.zone = this.zoneOf(pos, d);
    },

    zoneOf([lat, lng], d) {
      if (d < 50) return 'Garis start — ' + this.info().start;
      if (this.progress >= 1) return 'Garis finis — Holtekamp';
      if (lng < 140.7125) return lat > -2.56 ? 'Pusat Kota Jayapura' : 'Entrop – Hamadi';
      if (lng < 140.7250) return 'Jembatan Youtefa';
      if (lng < 140.7900) return 'Pesisir Holtekamp';
      return 'Koya – Muara Tami';
    },

    toggle() {
      if (this.playing) return this.stop();
      if (!RM.map) return;
      if (this.progress >= 1) this.seek(0);
      this.playing = true;
      // Durasi animasi: ±10 dtk untuk 5K hingga ±30 dtk untuk 42K
      const dur = 8000 + this.total / 2;
      let last = performance.now();
      const tick = (t) => {
        this.seek(this.progress + (t - last) / dur);
        last = t;
        if (this.progress >= 1) return this.stop();
        RM.raf = requestAnimationFrame(tick);
      };
      RM.raf = requestAnimationFrame(tick);
    },
    stop() { cancelAnimationFrame(RM.raf); this.playing = false; },
    reset() { this.stop(); this.seek(0); },

    fmtKm(m) { return (m / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); },
    fmtPace(p) { return `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, '0')}`; },
    fmtTime(s) {
      s = Math.round(s);
      const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    },
  };
}

function site() {
  return {
    /* ====== Tautan pendaftaran eksternal (Lynk.id) ====== */
    // Halaman detail produk/paket pendaftaran
    detailUrl: 'https://lynk.id/papuapeacemarathon/xjllezk17wjr',
    // Halaman checkout langsung
    registerUrl: 'https://lynk.id/papuapeacemarathon/xjllezk17wjr/checkout',

    scrolled: false,
    floatTimer: true,
    progress: 0,
    countdown: { days: 0, hours: 0, mins: 0, secs: 0 },

    nav: [
      { label: 'Tentang',  href: '#tentang' },
      { label: 'Rute',     href: '#rute' },
      { label: 'Kategori', href: '#kategori' },
      { label: 'Dampak',   href: '#dampak' },
      { label: 'Kampung',  href: '#kampung' },
      { label: 'Lokasi',   href: '#lokasi' },
      { label: 'Mitra',    href: '#mitra' },
      { label: 'FAQ',      href: '#faq' },
    ],

    facts: [
      { label: 'Tanggal',  value: '20 Mar 2027',  icon: 'fa-calendar-days' },
      { label: 'Lokasi',   value: 'Jayapura',     icon: 'fa-location-dot' },
      { label: 'Kategori', value: '5–42 KM',      icon: 'fa-person-running' },
      { label: 'Kuota',    value: '1.000 Pelari', icon: 'fa-users' },
    ],

    misi: [
      { icon: 'fa-people-group', text: 'Menghadirkan ruang perjumpaan nyata melalui olahraga bagi orang dari beragam suku, agama, komunitas, dan latar belakang.' },
      { icon: 'fa-hands-holding-circle', text: 'Mengajak peserta berlari, saling mendukung, dan merayakan bersama sebagai satu Papua.' },
      { icon: 'fa-hand-holding-heart', text: 'Membuka kesempatan bagi masyarakat, komunitas, organisasi, dan mitra untuk melayani serta membangun relasi lintas perbedaan.' },
      { icon: 'fa-dove', text: 'Mengubah stereotip Papua pulau perang menjadi Papua pulau damai, dan mengundang Indonesia mengalami Papua yang sebenarnya.' },
    ],

    stages: [
      { no: '01', title: 'Jantung Jayapura', desc: 'Berangkat saat fajar dari pusat kota — aspal datar, sorak warga, dan langkah pertama ribuan pelari yang bergerak sebagai satu barisan.', tags: ['Garis Start', 'Kota', 'Fajar'] },
      { no: '02', title: 'Teluk Youtefa', desc: 'Menyusuri lengkung jembatan dan garis pantai teluk; angin laut, bukit hijau, dan panorama ikonik Papua di setiap kilometer.', tags: ['Teluk', 'Jembatan', 'Pesisir'] },
      { no: '03', title: 'Muara Tami', desc: 'Lanskap terbuka, kampung-kampung yang menyambut, lalu kembali untuk merayakan garis finis bersama di Kampung Perdamaian.', tags: ['Kampung', 'Garis Finis', 'Perayaan'] },
    ],

    categories: [
      { km: '5K',  tag: 'Lari Keluarga',    desc: 'Langkah pertama untuk keluarga, pelajar, dan komunitas yang baru memulai.', points: ['Ramah pemula', 'Rute dalam kota', 'Medali penamat'], start: '06.30' },
      { km: '10K', tag: 'Lari Komunitas',   desc: 'Jarak favorit komunitas lari dan kantor untuk berlari berdampingan.', points: ['Pos air tiap 2,5 km', 'Pendamping laju lari', 'Medali penamat'], start: '06.00' },
      { km: '21K', tag: 'Setengah Maraton', desc: 'Setengah maraton menyusuri teluk — tantangan serius dengan pemandangan terbaik.', points: ['Cip pencatat waktu', 'Batas waktu 3,5 jam', 'Kaus lomba & medali'], start: '05.30' },
      { km: '42K', tag: 'Maraton Penuh',    desc: 'Maraton penuh: keluar dari zona nyaman fisik dan sosial, hingga Muara Tami.', points: ['Cip pencatat waktu', 'Batas waktu 6,5 jam', 'Paket penamat lengkap'], start: '05.00' },
    ],

    stats: [
      { value: 1000, suffix: '+', label: 'Peserta Lomba', shown: 0 },
      { value: 1000, suffix: '+', label: 'Penonton & Pendukung', shown: 0 },
      { value: 4,    suffix: '',  label: 'Kategori Lomba', shown: 0 },
      { value: 2000, suffix: '+', label: 'Orang Terjangkau', shown: 0 },
    ],

    impacts: [
      { icon: 'fa-handshake', text: 'Menciptakan perjumpaan positif antar-komunitas melalui olahraga.' },
      { icon: 'fa-school',    text: 'Melibatkan komunitas lari, sekolah, kampus, kantor, kelompok keagamaan, dan organisasi masyarakat.' },
      { icon: 'fa-hands-helping', text: 'Mendorong relawan dari beragam latar belakang untuk melayani dalam satu kegiatan.' },
    ],

    rundown: [
      { time: '04.30 WIT', title: 'Area lomba dibuka',     desc: 'Penitipan barang, pemanasan bersama, dan doa lintas iman.' },
      { time: '05.00 WIT', title: 'Pelepasan 42K',         desc: 'Maraton penuh memulai perjalanan menuju Muara Tami.' },
      { time: '05.30–06.30', title: 'Pelepasan 21K · 10K · 5K', desc: 'Gelombang keberangkatan berurutan dari pusat kota Jayapura.' },
      { time: '09.00 WIT', title: 'Kampung Perdamaian',    desc: 'Stan UMKM, musik, PeaceGen, dan ruang perjumpaan di Vtekya Restaurant.' },
      { time: '12.00 WIT', title: 'Seremoni & Penutupan',  desc: 'Penyerahan penghargaan dan perayaan bersama satu Papua.' },
    ],

    titik: [
      { label: 'Garis Start', name: 'Pusat Kota Jayapura',     desc: 'Jl. Raya Abepura, Kota Jayapura, Papua' },
      { label: 'Lintasan',    name: 'Teluk & Jembatan Youtefa', desc: 'Menyusuri garis pantai teluk menuju Muara Tami' },
      { label: 'Garis Finis', name: 'Vtekya Restaurant',       desc: 'Kampung Perdamaian · Area lomba' },
    ],

    tiers: [
      { name: 'Sahabat', slot: 'Mitra Komunitas', featured: false,
        benefits: ['Logo di situs & materi digital', 'Penyebutan di media sosial', 'Stan komunitas di Kampung Perdamaian', '5 kuota pendaftaran'] },
      { name: 'Mitra', slot: 'Mitra Resmi', featured: true,
        benefits: ['Logo di latar panggung, gerbang, dan kaus lomba', 'Stan utama di Kampung Perdamaian', 'Penyebutan pembawa acara di panggung utama', 'Konten kolaborasi media sosial', '25 kuota pendaftaran'] },
      { name: 'Utama', slot: 'Sponsor Utama', featured: false,
        benefits: ['Penamaan dalam judul acara', 'Penempatan logo prioritas di semua kanal', 'Sesi seremoni & konferensi pers', 'Aktivasi merek khusus', '60 kuota pendaftaran'] },
    ],

    penyelenggara: ['Peace Generation', 'Peacemaker Papua', 'Beyond Education Centre'],

    faqs: [
      { q: 'Kapan dan di mana acara berlangsung?', a: 'Sabtu, 20 Maret 2027 di Jayapura dan Muara Tami, Papua. Garis finis dan acara penutup berlangsung di Vtekya Restaurant — Kampung Perdamaian.' },
      { q: 'Bagaimana cara mendaftar?', a: 'Pendaftaran dan pembayaran dilakukan melalui Lynk.id. Klik tombol Daftar Sekarang untuk langsung menuju halaman pembayaran, atau Detail Paket untuk membaca rincian paket terlebih dahulu.' },
      { q: 'Kategori apa saja yang tersedia?', a: 'Tersedia empat kategori: 5K, 10K, 21K (setengah maraton), dan 42K (maraton penuh), terbuka untuk pelari dari berbagai tingkat kemampuan.' },
      { q: 'Siapa saja yang boleh ikut?', a: 'Terbuka untuk umum dari seluruh Indonesia. Kategori 21K dan 42K memiliki batas usia minimum dan ketentuan kesehatan yang diumumkan bersama pembukaan pendaftaran.' },
      { q: 'Bagaimana cara menjadi mitra atau sponsor?', a: 'Perusahaan, lembaga, usaha lokal, maupun individu dapat bergabung melalui paket Sahabat, Mitra, atau Utama. Hubungi panitia melalui email untuk menerima proposal lengkap.' },
      { q: 'Apakah tersedia kesempatan menjadi relawan?', a: 'Ya. Kami mengundang relawan dari beragam suku, agama, dan komunitas untuk melayani bersama — pendaftaran relawan dibuka bersamaan dengan pendaftaran peserta.' },
    ],

    /* ---------------- behaviour ---------------- */
    init() {
      this.tick();
      setInterval(() => this.tick(), 1000);
      this.onScroll();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      this.observe();
      this.parallax();
    },

    tick() {
      const target = new Date('2027-03-20T05:00:00+09:00').getTime();
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      this.countdown = { days: d, hours: h, mins: m, secs: Math.floor(diff / 1000) };
    },

    onScroll() {
      const y = window.scrollY;
      this.scrolled = y > 60;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      this.progress = h > 0 ? Math.min(100, (y / h) * 100) : 0;
    },

    observe() {
      // Elemen [data-reveal] di dalam <template x-for> baru dirender Alpine setelah init(),
      // jadi pantau juga node yang ditambahkan belakangan.
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      const watch = (root) => {
        if (root.matches?.('[data-reveal]:not(.is-in)')) io.observe(root);
        root.querySelectorAll?.('[data-reveal]:not(.is-in)').forEach(el => io.observe(el));
      };
      watch(document);
      new MutationObserver((muts) => muts.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && watch(n))))
        .observe(document.body, { childList: true, subtree: true });

      const co = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          co.unobserve(e.target);
          this.stats.forEach((s, i) => {
            const dur = 1600, t0 = performance.now();
            const step = (t) => {
              const p = Math.min(1, (t - t0) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              this.stats[i].shown = Math.round(s.value * eased).toLocaleString('id-ID');
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          });
        });
      }, { threshold: 0.3 });
      const statsEl = document.querySelector('#dampak');
      if (statsEl) co.observe(statsEl);
    },

    parallax() {
      const els = [...document.querySelectorAll('[data-parallax]')];
      if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let ticking = false;
      const run = () => {
        const vh = window.innerHeight;
        els.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const speed = parseFloat(el.dataset.parallax) || 0;
          const offset = (r.top + r.height / 2 - vh / 2) * speed;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
        ticking = false;
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      run();
    },
  }
}
