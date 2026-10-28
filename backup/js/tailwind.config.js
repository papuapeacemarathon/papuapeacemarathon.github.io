/* ====== Konfigurasi Tailwind CDN — palet brand Papua Peace ======
   Dimuat tepat setelah https://cdn.tailwindcss.com */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        forest:   '#0E2A21',   // hijau tergelap — dasar
        pine:     '#123A2C',   // hijau tua
        jungle:   '#1A4A38',   // hijau tua brand (lockup)
        emerald2: '#2E8B6E',   // hijau brand (teks PEACE)
        moss:     '#26735B',
        gold:     '#FFC800',   // kuning logo (teks MARATHON)
        amber2:   '#DEB43C',   // emas pola bg1
        wine:     '#6E2140',   // maroon brand
        wine2:    '#8A2C50',
        cream:    '#F3EBD8',   // krem brand
        sand:     '#DCCFA8',
        bark:     '#3A2F21',
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { ultra: '0.35em' },
    },
  },
};
